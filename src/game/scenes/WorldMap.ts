import * as Phaser from 'phaser';
import { generateMap } from '../../modules/hex-grid/MapGenerator';
import { createHexGridModule } from '../../modules/hex-grid/index';
import { neighbors, toPixel } from '../../modules/hex-grid/HexCoordUtils';
import { BASE_CLASSES, getClassById } from '../../data/classes';
import { Toast } from '../ui/Toast';
import { ESCORT_TEMPLATE } from '../../data/escort';
import { StatPanel } from '../ui/StatPanel';
import { ModeLabel } from '../ui/ModeLabel';
import { TurnBudgetLabel } from '../ui/TurnBudgetLabel';
import { TownPanel } from '../ui/TownPanel';
import type { Character } from '../../models/character';
import type { HexCoord, HexTile } from '../../models/hex';
import type { GameMode, GameModeType } from '../../models/save';
import type { SaveState } from '../../models/save';
import type { WorldMap as WorldMapModel } from '../../models/world-map';
import type { EnemyCamp } from '../../models/enemy';
import type { Town } from '../../models/town';
import { createSaveModule, serialise } from '../../modules/save';
import { hireCharacter } from '../../modules/recruitment/TownService';
import { CameraController } from '../../modules/camera/CameraController';
import type { CameraKeys } from '../../modules/camera/CameraController';
import { DeathMarkerStore, TurnBudgetManager, planPartyMove } from '../../modules/world-map';
import { shouldRecomputeHoverPreview } from '../../modules/world-map/HoverPreviewThrottle';

const { module: saveModule } = createSaveModule();

const TILE_SIZE = 36;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

function uuid(): string {
  return crypto.randomUUID();
}

function terrainColor(terrain: string): number {
  const map: Record<string, number> = {
    ocean: 0x1a4a7a,
    beach: 0xc4a45a,
    grassland: 0x2d5a27,
    forest: 0x1a3a10,
    desert: 0x8b6914,
    mountain: 0x5a4030,
    snow: 0xe8e8f0,
  };
  return map[terrain] ?? 0x444444;
}

export class WorldMap extends Phaser.Scene {
  private hexModule!: ReturnType<typeof createHexGridModule>;
  private party: Character[] = [];
  private charSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private deathMarkerSprites: Phaser.GameObjects.Text[] = [];
  private movementOverlay: Phaser.GameObjects.Graphics | null = null;
  private hoverPreviewOverlay: Phaser.GameObjects.Graphics | null = null;
  private hoveredTileCoord: HexCoord | null = null;
  private statPanel!: StatPanel;
  private modeLabel!: ModeLabel;
  private turnBudgetLabel: TurnBudgetLabel | null = null;
  private turnBudgetManager!: TurnBudgetManager;
  private deathMarkerStore = new DeathMarkerStore();
  private selectedChar: Character | null = null;
  private saveBar: HTMLDivElement | null = null;
  private townPanel: TownPanel | null = null;
  private towns: Town[] = [];
  private cameraController: CameraController | null = null;
  private reCenterBtn: HTMLButtonElement | null = null;
  private endTurnKey: Phaser.Input.Keyboard.Key | null = null;
  private cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  } | null = null;

  constructor() {
    super({ key: 'WorldMap' });
  }

  create(): void {
    const mode = (this.registry.get('gameMode') as GameModeType | undefined) ?? 'casual';
    this.registry.set('gameMode', mode); // normalise
    this.modeLabel = new ModeLabel(mode);
    const playerClassId = this.registry.get('playerClassId') as string ?? 'fighter';

    const savedState = this.registry.get('saveState');
    if (savedState) {
      // Restore from save
      this.restoreFromSave(savedState);
      return;
    }

    const seed = `run_${Date.now()}`;
    const worldMapData = generateMap(seed, MAP_WIDTH, MAP_HEIGHT);
    this.hexModule = createHexGridModule(worldMapData);

    this.buildParty(playerClassId, worldMapData.playerStartCoord);
    this.renderMap();
    this.renderParty();
    this.createMovementOverlays();
    this.initialiseTurnBudget();
    this.renderDeathMarkers();

    this.statPanel = new StatPanel();
    if (this.party[0]) {
      this.selectedChar = this.party[0];
      this.statPanel.render(this.party[0]);
    }

    // Explore starting tile
    this.hexModule.store.exploreTile(worldMapData.playerStartCoord);
    this.renderSaveBar(mode);
    this.renderTurnBudgetLabel();

    // T014: Set up camera after party is constructed
    this.initCamera();
  }

  private restoreFromSave(saveState: SaveState): void {
    this.party = saveState.party;
    this.hexModule = createHexGridModule(saveState.worldMap);
    this.towns = saveState.towns;
    this.deathMarkerStore.load(saveState.deathMarkers ?? []);
    this.repairLegacyPartyPositions();
    this.initialiseTurnBudget(saveState.worldMap.remainingTurnBudget);

    this.renderMap();
    this.renderParty();
    this.createMovementOverlays();
    this.renderDeathMarkers();

    this.statPanel = new StatPanel();
    if (this.party[0]) {
      this.selectedChar = this.party[0];
      this.statPanel.render(this.party[0]);
    }
    this.renderSaveBar(saveState.gameMode.type);
    this.renderTurnBudgetLabel();

    if (this.registry.get('worldMapTurnRefresh') === true) {
      this.registry.remove('worldMapTurnRefresh');
      this.refreshTurnBudget();
    }

    // T014: Set up camera after party is restored
    this.initCamera();
  }

  private initialiseTurnBudget(remainingBudget?: number): void {
    const initialRemaining = typeof remainingBudget === 'number'
      ? remainingBudget
      : TurnBudgetManager.fromParty(this.party).getRemaining();
    this.turnBudgetManager = new TurnBudgetManager(initialRemaining);
    this.syncTurnBudgetState();
  }

  private syncTurnBudgetState(): void {
    const map = this.hexModule.store.getMap() as WorldMapModel;
    map.remainingTurnBudget = this.turnBudgetManager.getRemaining();
    this.turnBudgetLabel?.update(this.turnBudgetManager.getRemaining());
    this.publishLiveState();
    this.updateMovementOverlays();
  }

  private publishLiveState(): void {
    if (!this.hexModule) return;

    const worldMap = this.hexModule.store.getMap();
    const currentLocation = this.getPartyCoord() ?? worldMap.playerStartCoord;
    const previous = this.registry.get('saveState') as SaveState | undefined;
    const mode = (this.registry.get('gameMode') as GameModeType | undefined) ?? previous?.gameMode.type ?? 'casual';

    const saveState = serialise({
      gameMode: previous?.gameMode ?? {
        type: mode,
        allowManualSave: mode === 'casual',
        autoSaveOnCheckpoint: mode === 'roguelike',
      },
      worldMap: {
        ...worldMap,
        remainingTurnBudget: this.turnBudgetManager.getRemaining(),
      },
      party: this.party,
      deathMarkers: this.deathMarkerStore.serialise(),
      deathHistory: previous?.deathHistory ?? [],
      invalidated: previous?.invalidated ?? false,
      towns: this.towns,
      enemyCamps: (worldMap as unknown as { enemyCamps: EnemyCamp[] }).enemyCamps ?? [],
      activeCombat: null,
      currentLocation,
      gold: this.registry.get('gold') as number ?? previous?.gold ?? 0,
      metaProgression: previous?.metaProgression ?? { schemaVersion: 1 },
    });

    this.registry.set('worldMap', saveState.worldMap);
    this.registry.set('saveState', saveState);
  }

  private renderTurnBudgetLabel(): void {
    if (this.turnBudgetLabel) {
      this.turnBudgetLabel.destroy();
    }

    this.turnBudgetLabel = new TurnBudgetLabel(this.turnBudgetManager.getRemaining(), () => {
      this.refreshTurnBudget();
    });
  }

  private refreshTurnBudget(): void {
    this.turnBudgetManager.resetBudget(this.party);
    this.syncTurnBudgetState();
  }

  private createMovementOverlays(): void {
    if (!this.movementOverlay) {
      this.movementOverlay = this.add.graphics();
      this.movementOverlay.setDepth(8);
    }

    if (!this.hoverPreviewOverlay) {
      this.hoverPreviewOverlay = this.add.graphics();
      this.hoverPreviewOverlay.setDepth(9);
    }

    this.updateMovementOverlays();
  }

  private clearMovementOverlays(): void {
    this.movementOverlay?.clear();
    this.hoverPreviewOverlay?.clear();
  }

  private setHoveredTileCoord(coord: HexCoord | null): void {
    if (!shouldRecomputeHoverPreview(this.hoveredTileCoord, coord)) return;

    this.hoveredTileCoord = coord;
    this.updateMovementOverlays();
  }

  private updateMovementOverlays(): void {
    if (!this.movementOverlay || !this.hoverPreviewOverlay) return;

    this.clearMovementOverlays();

    const origin = this.getPartyCoord();
    const remainingBudget = this.turnBudgetManager?.getRemaining?.() ?? 0;
    if (!origin || remainingBudget <= 0) return;

    const map = this.hexModule.store.getMap();
    const reachableTiles = this.hexModule.reachableTiles(origin, remainingBudget);
    for (const tile of reachableTiles) {
      const { x, y } = toPixel(tile.coord, TILE_SIZE);
      this.movementOverlay.fillStyle(0x5ec8ff, 0.18);
      this.movementOverlay.lineStyle(1, 0x9fe6ff, 0.5);
      this.drawHex(this.movementOverlay, x, y, TILE_SIZE - 5, 0x5ec8ff, false);
    }

    if (!this.hoveredTileCoord) return;

    const path = this.hexModule.findPath(origin, this.hoveredTileCoord);
    if (!path || path.length === 0) return;

    let spent = 0;
    let previous = origin;
    for (const step of path) {
      const tile = map.tiles[`${step.q},${step.r},${step.s}`];
      if (!tile) continue;
      spent += tile.moveCost;
      const color = spent <= remainingBudget ? 0xffd94d : 0xff6b6b;
      const previousPixel = toPixel(previous, TILE_SIZE);
      const currentPixel = toPixel(step, TILE_SIZE);

      this.hoverPreviewOverlay.lineStyle(4, color, 0.95);
      this.hoverPreviewOverlay.beginPath();
      this.hoverPreviewOverlay.moveTo(previousPixel.x, previousPixel.y);
      this.hoverPreviewOverlay.lineTo(currentPixel.x, currentPixel.y);
      this.hoverPreviewOverlay.strokePath();

      previous = step;
    }
  }

  private getPartyCoord(): HexCoord | null {
    const map = this.hexModule.store.getMap();
    const activeParty = this.party.filter((character) => character.status === 'active');
    const partyIds = activeParty.length > 0 ? activeParty.map((character) => character.id) : this.party.map((character) => character.id);

    for (const tile of Object.values(map.tiles)) {
      if (partyIds.some((id) => tile.occupants.includes(id))) {
        return tile.coord;
      }
    }

    return null;
  }

  private getCharCoord(characterId: string): HexCoord | null {
    const map = this.hexModule.store.getMap();
    for (const tile of Object.values(map.tiles)) {
      if (tile.occupants.includes(characterId)) return tile.coord;
    }
    return null;
  }

  private repairLegacyPartyPositions(): void {
    const map = this.hexModule.store.getMap();
    const pc = this.party.find((character) => character.role === 'pc') ?? this.party[0];
    if (!pc) return;

    const pcCoord = this.getCharCoord(pc.id) ?? map.playerStartCoord;

    for (const character of this.party) {
      const currentCoord = this.getCharCoord(character.id);
      if (!currentCoord || currentCoord.q !== pcCoord.q || currentCoord.r !== pcCoord.r || currentCoord.s !== pcCoord.s) {
        this.hexModule.store.moveOccupant(character.id, currentCoord ?? pcCoord, pcCoord);
      }
    }
  }

  private clearDeathMarkerSprites(): void {
    for (const marker of this.deathMarkerSprites) {
      marker.destroy();
    }
    this.deathMarkerSprites = [];
  }

  private renderDeathMarkers(): void {
    this.clearDeathMarkerSprites();

    const map = this.hexModule.store.getMap();
    for (const marker of this.deathMarkerStore.getMarkers()) {
      const tile = map.tiles[`${marker.coord.q},${marker.coord.r},${marker.coord.s}`];
      if (!tile) continue;

      const { x, y } = toPixel(tile.coord, TILE_SIZE);
      const text = this.add.text(x, y - 28, `☠ ${marker.name}`, {
        color: '#ff7a7a',
        fontSize: '12px',
        fontStyle: 'bold',
        backgroundColor: '#1f0f14',
        padding: { left: 6, right: 6, top: 2, bottom: 2 },
      });
      text.setOrigin(0.5, 0.5);
      text.setDepth(20);
      this.deathMarkerSprites.push(text);
    }
  }

  private endTurn(): void {
    this.refreshTurnBudget();
  }

  // ── Camera setup (T014) ───────────────────────────────────────────────────

  /** Returns the active character's current tile coord, or null if no active char. */
  private getActiveCharCoord(): HexCoord | null {
    if (!this.selectedChar) return null;
    const map = this.hexModule.store.getMap();
    for (const t of Object.values(map.tiles)) {
      if (t.occupants.includes(this.selectedChar.id)) return t.coord;
    }
    return null;
  }

  /** True for party members that the player directly controls (PC and escort on world map). */
  private isPlayerControlled(ch: Character): boolean {
    return ch.role === 'pc' || ch.role === 'escort' || ch.role === 'adventurer';
  }

  /**
   * T014: Construct CameraController, call setBounds(), center on active char.
   * Also registers keyboard inputs (T027) and creates re-center button (T031).
   */
  private initCamera(): void {
    const tiles = Object.values(this.hexModule.store.getMap().tiles);
    this.cameraController = new CameraController({
      camera: this.cameras.main,
      tileWorldPos: (coord) => toPixel(coord, TILE_SIZE),
      tileSize: TILE_SIZE,
    });

    this.cameraController.setBounds(tiles);

    const activeCoord = this.getActiveCharCoord();
    if (activeCoord) {
      const { x, y } = toPixel(activeCoord, TILE_SIZE);
      this.cameraController.centerOn(x, y);
    }

    // T027: Register keyboard inputs
    if (this.input.keyboard) {
      this.cursorKeys = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.endTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    // T031: Create re-center button
    this.renderReCenterBtn();

    // Expose helpers for e2e tests
    (this as unknown as Record<string, unknown>)._getActiveCharWorldPos = () => {
      const coord = this.getActiveCharCoord();
      if (!coord) return { x: 0, y: 0 };
      return toPixel(coord, TILE_SIZE);
    };
    (this as unknown as Record<string, unknown>)._clickNeighbourTile = () => {
      if (!this.selectedChar) return false;
      const coord = this.getActiveCharCoord();
      if (!coord) return false;
      const map = this.hexModule.store.getMap();
      for (const n of neighbors(coord)) {
        const key = `${n.q},${n.r},${n.s}`;
        if (map.tiles[key]?.passable) {
          this.onTileClick(map.tiles[key]);
          break;
        }
      }
      return true;
    };
    (this as unknown as Record<string, unknown>)._simulateEnemyTurn = () => false;
    (this as unknown as Record<string, unknown>)._getWorldMapSnapshot = () => ({
      remainingTurnBudget: this.turnBudgetManager?.getRemaining?.() ?? 0,
      deathMarkerCount: this.deathMarkerStore.getMarkers().length,
      partySize: this.party.length,
      activePartySize: this.party.filter((character) => character.status === 'active').length,
    });
    (this as unknown as Record<string, unknown>)._selectPartyMemberByIndex = (index: number) => {
      const character = this.party[index];
      if (!character) return false;
      this.selectChar(character);
      return true;
    };
  }

  /** T027: Called each frame by Phaser — passes keyboard state to CameraController. */
  update(_time: number, delta: number): void {
    if (this.endTurnKey && Phaser.Input.Keyboard.JustDown(this.endTurnKey)) {
      this.endTurn();
    }

    if (!this.cameraController) return;

    const keys: CameraKeys = {
      up: (this.cursorKeys?.up.isDown ?? false) || (this.wasdKeys?.W.isDown ?? false),
      down: (this.cursorKeys?.down.isDown ?? false) || (this.wasdKeys?.S.isDown ?? false),
      left: (this.cursorKeys?.left.isDown ?? false) || (this.wasdKeys?.A.isDown ?? false),
      right: (this.cursorKeys?.right.isDown ?? false) || (this.wasdKeys?.D.isDown ?? false),
    };

    this.cameraController.update(keys, delta);
  }

  /** T031: Create the persistent re-center button DOM element. */
  private renderReCenterBtn(): void {
    if (this.reCenterBtn) { this.reCenterBtn.remove(); this.reCenterBtn = null; }

    const btn = document.createElement('button');
    btn.id = 'btn-recenter';
    btn.className = 'fixed bottom-4 right-64 z-30 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded-lg';
    btn.textContent = '⌖ Re-center';
    btn.addEventListener('click', () => {
      if (!this.cameraController) return;
      const coord = this.getActiveCharCoord();
      if (coord) this.cameraController.reCenterOn(coord);
    });
    document.body.appendChild(btn);
    this.reCenterBtn = btn;
  }

  /**
   * T020b: Select a character and pan the camera to them (character-switch pan).
   * FR-012 guard: only pan for player-controlled characters.
   */
  private selectChar(ch: Character): void {
    this.selectedChar = ch;
    this.statPanel.render(ch);

    // T020b: Pan camera to newly selected character (FR-012: player-controlled only)
    if (this.cameraController && this.isPlayerControlled(ch)) {
      const coord = this.getActiveCharCoord();
      if (coord) this.cameraController.followTo(coord, 1);
    }
  }

  private renderSaveBar(mode: GameModeType): void {
    if (this.saveBar) { this.saveBar.remove(); this.saveBar = null; }

    const bar = document.createElement('div');
    bar.className = 'fixed bottom-4 right-4 flex gap-2 z-30';

    if (mode === 'casual') {
      bar.innerHTML = `
        <button id="btn-save-game" class="bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-lg">Save Game</button>
        <button id="btn-export-save" class="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 px-4 rounded-lg">Export Save</button>
      `;
    } else {
      bar.innerHTML = `
        <div class="bg-gray-800 text-gray-500 text-xs px-4 py-2 rounded-lg pointer-events-none">Auto-save active</div>
      `;
    }

    document.body.appendChild(bar);
    this.saveBar = bar;

    if (mode === 'casual') {
      document.getElementById('btn-save-game')!.addEventListener('click', () => this.manualSave());
      document.getElementById('btn-export-save')!.addEventListener('click', () => this.exportSave());
    }
  }

  private async manualSave(): Promise<void> {
    const worldMap = this.hexModule.store.getMap();
    const mode: GameMode = this.registry.get('gameModeObj') ?? {
      type: (this.registry.get('gameMode') as GameModeType ?? 'casual'),
      allowManualSave: true,
      autoSaveOnCheckpoint: false,
    };
    const currentLocation: HexCoord = this.getPartyCoord() ?? worldMap.playerStartCoord;
    const state = serialise({
      gameMode: mode,
      worldMap: {
        ...worldMap,
        remainingTurnBudget: this.turnBudgetManager.getRemaining(),
      },
      party: this.party,
      deathMarkers: this.deathMarkerStore.serialise(),
      deathHistory: [],
      invalidated: false,
      towns: [],
      enemyCamps: (worldMap as unknown as { enemyCamps: EnemyCamp[] }).enemyCamps ?? [],
      activeCombat: null,
      currentLocation,
      gold: this.registry.get('gold') as number ?? 0,
      metaProgression: { schemaVersion: 1 },
    });
    const result = await saveModule.saveToStorage(state);
    this.showSaveToast(result.success ? 'Game saved!' : `Save failed: ${result.error}`);
  }

  private exportSave(): void {
    const worldMap = this.hexModule.store.getMap();
    const mode: GameMode = this.registry.get('gameModeObj') ?? {
      type: (this.registry.get('gameMode') as GameModeType ?? 'casual'),
      allowManualSave: true,
      autoSaveOnCheckpoint: false,
    };
    const currentLocation: HexCoord = this.getPartyCoord() ?? worldMap.playerStartCoord;
    const state = serialise({
      gameMode: mode,
      worldMap: {
        ...worldMap,
        remainingTurnBudget: this.turnBudgetManager.getRemaining(),
      },
      party: this.party,
      deathMarkers: this.deathMarkerStore.serialise(),
      deathHistory: [],
      invalidated: false,
      towns: [],
      enemyCamps: (worldMap as unknown as { enemyCamps: EnemyCamp[] }).enemyCamps ?? [],
      activeCombat: null,
      currentLocation,
      gold: this.registry.get('gold') as number ?? 0,
      metaProgression: { schemaVersion: 1 },
    });
    saveModule.exportToFile(state);
  }

  private showTownPanel(town: Town): void {
    if (this.townPanel) { this.townPanel.destroy(); this.townPanel = null; }
    const gold = this.registry.get('gold') as number ?? 0;
    this.townPanel = new TownPanel(
      town.hirePool,
      this.party,
      gold,
      (hero) => {
        const result = hireCharacter(hero, this.party, this.registry.get('gold') as number ?? 0);
        if ('character' in result) {
          this.party.push(result.character);
          this.registry.set('gold', result.goldAfter);
          this.townPanel?.destroy();
          this.townPanel = null;
          this.showTownPanel(town); // re-open panel with updated state
        }
      },
      () => { this.townPanel?.destroy(); this.townPanel = null; this.refreshTurnBudget(); },
    );
  }

  private showSaveToast(message: string): void {
    const isError = message.toLowerCase().includes('fail') || message.toLowerCase().includes('full');
    Toast.show(message, isError ? 'error' : 'success', 2000);
  }

  private buildParty(classId: string, startCoord: HexCoord): void {
    const classDef = getClassById(classId) ?? BASE_CLASSES[0];

    const pc: Character = {
      id: uuid(),
      name: 'Hero',
      role: 'pc',
      classId: classDef.id,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      hp: classDef.maxHpBase,
      maxHp: classDef.maxHpBase,
      attributes: { ...classDef.baseStats },
      portrait: 'char-pc',
      recruitmentSource: 'starting',
      status: 'active',
      statusEffects: [],
      deathRecord: null,
      actedThisPhase: false,
    };

    const escort: Character = {
      ...ESCORT_TEMPLATE,
      id: uuid(),
      recruitmentSource: 'starting',
      actedThisPhase: false,
      deathRecord: null,
    };

    this.party = [pc, escort];
    this.registry.set('gold', 20); // FR-012d: initialise gold at run start

    // Place both characters on the starting tile
    for (const ch of this.party) {
      this.hexModule.store.moveOccupant(ch.id, startCoord, startCoord);
    }
  }

  private renderMap(): void {
    const tiles = Object.values(this.hexModule.store.getMap().tiles);

    for (const tile of tiles) {
      const { x, y } = toPixel(tile.coord, TILE_SIZE);

      const color = terrainColor(tile.terrain);
      const gfx = this.add.graphics();
      const fogged = !tile.explored;
      this.drawHex(gfx, x, y, TILE_SIZE - 2, color, fogged);

      // Make tile interactive
      const hitArea = new Phaser.Geom.Circle(x, y, TILE_SIZE - 4);
      gfx.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
      gfx.on('pointerdown', () => this.onTileClick(tile));
      gfx.on('pointerover', () => {
        gfx.setAlpha(0.8);
        this.setHoveredTileCoord(tile.coord);
      });
      gfx.on('pointerout', () => {
        gfx.setAlpha(1);
        if (this.hoveredTileCoord && this.hoveredTileCoord.q === tile.coord.q && this.hoveredTileCoord.r === tile.coord.r && this.hoveredTileCoord.s === tile.coord.s) {
          this.setHoveredTileCoord(null);
        }
      });
    }

    this.cameras.main.setZoom(1);
  }

  private drawHex(
    gfx: Phaser.GameObjects.Graphics,
    cx: number, cy: number, size: number,
    color: number, fogged: boolean,
  ): void {
    const c = fogged ? 0x222233 : color;
    gfx.fillStyle(c, 1);
    gfx.lineStyle(1, 0x000000, 0.5);

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30); // pointy-top
      points.push({ x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) });
    }

    gfx.fillPoints(points as Phaser.Math.Vector2[], true);
    gfx.strokePoints(points as Phaser.Math.Vector2[], true);
  }

  private renderParty(): void {
    for (const ch of this.party) {
        if (ch.status === 'dead' && ch.role !== 'pc') {
          continue;
        }
      const map = this.hexModule.store.getMap();
      // Find which tile this character occupies
      for (const tile of Object.values(map.tiles)) {
        if (tile.occupants.includes(ch.id)) {
          const { x, y } = toPixel(tile.coord, TILE_SIZE);
          const sprite = this.add.image(x, y - 5, ch.portrait);
          sprite.setScale(0.7);
          sprite.setInteractive();
          sprite.on('pointerdown', () => {
            this.selectChar(ch);
          });
          this.charSprites.set(ch.id, sprite);
          break;
        }
      }
    }
  }

  private onTileClick(tile: HexTile): void {
    if (!this.selectedChar || !tile.passable || this.turnBudgetManager.getRemaining() <= 0) return;

    const map = this.hexModule.store.getMap() as WorldMapModel;
    const fromCoord = this.getPartyCoord();
    if (!fromCoord) return;

    const plan = planPartyMove(fromCoord, tile.coord, this.turnBudgetManager.getRemaining(), map);
    if (!plan.reachable || !plan.destination || plan.traversed <= 0) return;
    const destination = plan.destination;

    for (const character of this.party) {
      this.hexModule.store.moveOccupant(character.id, fromCoord, destination);
    }

    this.turnBudgetManager.consume(plan.traversed);
    this.syncTurnBudgetState();
    this.hexModule.store.exploreTile(destination);

    if (this.cameraController && this.isPlayerControlled(this.selectedChar)) {
      this.cameraController.followTo(destination, plan.traversed);
    }

    // Check if destination is a town → show TownPanel
    const destTile = this.hexModule.store.getMap().tiles[`${destination.q},${destination.r},${destination.s}`];
    if (destTile?.poiTag === 'town') {
      const town = this.towns.find(
        (t: Town) => t.coord.q === destination.q && t.coord.r === destination.r,
      );
      if (town) {
        this.showTownPanel(town);
        return;
      }
    }

    // Check if destination has an active enemy camp → launch combat
    if (destTile?.poiTag === 'enemy-camp') {
      const worldMap = this.hexModule.store.getMap();
      const camp = (worldMap as unknown as { enemyCamps: EnemyCamp[] }).enemyCamps
        ?.find((ec: EnemyCamp) => ec.coord.q === destination.q && ec.coord.r === destination.r && !ec.defeated);
      if (camp && camp.enemies.length > 0) {
        const mode: GameMode = this.registry.get('gameModeObj') ?? {
          type: (this.registry.get('gameMode') as GameModeType ?? 'casual'),
          allowManualSave: true,
          autoSaveOnCheckpoint: true,
        };
        this.statPanel.destroy();
        this.charSprites.clear();
        this.scene.start('Combat', {
          playerUnits: this.party,
          enemyUnits: camp.enemies,
          mode,
          encounterId: camp.id,
        });
        return;
      }
    }

    // Auto-save checkpoint for roguelike mode
    const currentMode = (this.registry.get('gameModeObj') as GameMode | undefined) ?? {
      type: (this.registry.get('gameMode') as GameModeType ?? 'casual'),
      allowManualSave: true,
      autoSaveOnCheckpoint: false,
    };
    if (currentMode.autoSaveOnCheckpoint) {
      const worldMap = this.hexModule.store.getMap();
      const saveState = serialise({
        gameMode: currentMode,
        worldMap: {
          ...worldMap,
          remainingTurnBudget: this.turnBudgetManager.getRemaining(),
        },
        party: this.party,
        deathMarkers: this.deathMarkerStore.serialise(),
        deathHistory: [],
        invalidated: false,
        towns: [],
        enemyCamps: (worldMap as unknown as { enemyCamps: EnemyCamp[] }).enemyCamps ?? [],
        activeCombat: null,
        currentLocation: destination,
        gold: this.registry.get('gold') as number ?? 0,
        metaProgression: { schemaVersion: 1 },
      });
      saveModule.autoSave(saveState).catch(console.warn);
    }

    for (const character of this.party) {
      const sprite = this.charSprites.get(character.id);
      if (!sprite) continue;
      const { x, y } = toPixel(destination, TILE_SIZE);
      this.tweens.add({
        targets: sprite,
        x,
        y: y - 5,
        duration: 300,
        ease: 'Quad.easeOut',
      });
    }
  }

  shutdown(): void {
    this.charSprites.clear();
    this.clearDeathMarkerSprites();
    this.clearMovementOverlays();
    this.movementOverlay?.destroy();
    this.movementOverlay = null;
    this.hoverPreviewOverlay?.destroy();
    this.hoverPreviewOverlay = null;
    if (this.statPanel) this.statPanel.destroy();
    if (this.modeLabel) this.modeLabel.destroy();
    if (this.turnBudgetLabel) { this.turnBudgetLabel.destroy(); this.turnBudgetLabel = null; }
    if (this.saveBar) { this.saveBar.remove(); this.saveBar = null; }
    if (this.townPanel) { this.townPanel.destroy(); this.townPanel = null; }
    // T031: Remove re-center button DOM element
    if (this.reCenterBtn) { this.reCenterBtn.remove(); this.reCenterBtn = null; }
  }
}
