import * as Phaser from 'phaser';
import { generateMap } from '../../modules/hex-grid/MapGenerator';
import { createHexGridModule } from '../../modules/hex-grid/index';
import { toPixel } from '../../modules/hex-grid/HexCoordUtils';
import { BASE_CLASSES, getClassById } from '../../data/classes';
import { Toast } from '../ui/Toast';
import { ESCORT_TEMPLATE } from '../../data/escort';
import { StatPanel } from '../ui/StatPanel';
import { ModeLabel } from '../ui/ModeLabel';
import { TownPanel } from '../ui/TownPanel';
import type { Character } from '../../models/character';
import type { HexCoord, HexTile } from '../../models/hex';
import type { GameMode, GameModeType } from '../../models/save';
import type { EnemyCamp } from '../../models/enemy';
import type { Town } from '../../models/town';
import { createSaveModule, serialise } from '../../modules/save';
import { hireCharacter } from '../../modules/recruitment/TownService';
import { CameraController } from '../../modules/camera/CameraController';
import type { CameraKeys } from '../../modules/camera/CameraController';

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
  private statPanel!: StatPanel;
  private modeLabel!: ModeLabel;
  private selectedChar: Character | null = null;
  private saveBar: HTMLDivElement | null = null;
  private townPanel: TownPanel | null = null;
  private towns: Town[] = [];
  private cameraController: CameraController | null = null;
  private reCenterBtn: HTMLButtonElement | null = null;
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

    this.statPanel = new StatPanel();
    if (this.party[0]) {
      this.selectedChar = this.party[0];
      this.statPanel.render(this.party[0]);
    }

    // Explore starting tile
    this.hexModule.store.exploreTile(worldMapData.playerStartCoord);
    this.renderSaveBar(mode);

    // T014: Set up camera after party is constructed
    this.initCamera();
  }

  private restoreFromSave(saveState: ReturnType<typeof serialise>): void {
    this.party = saveState.party;
    this.hexModule = createHexGridModule(saveState.worldMap);

    this.renderMap();
    this.renderParty();

    this.statPanel = new StatPanel();
    if (this.party[0]) {
      this.selectedChar = this.party[0];
      this.statPanel.render(this.party[0]);
    }
    this.renderSaveBar(saveState.gameMode.type);

    // T014: Set up camera after party is restored
    this.initCamera();
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
      // Find a passable neighbour tile
      import('../../modules/hex-grid/HexCoordUtils').then(({ neighbors }) => {
        for (const n of neighbors(coord)) {
          const key = `${n.q},${n.r}`;
          if (map.tiles[key]?.passable) {
            this.onTileClick(map.tiles[key]);
            break;
          }
        }
      });
      return true;
    };
    (this as unknown as Record<string, unknown>)._simulateEnemyTurn = () => false;
  }

  /** T027: Called each frame by Phaser — passes keyboard state to CameraController. */
  update(_time: number, delta: number): void {
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
    btn.className = 'fixed bottom-4 right-48 z-30 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded-lg';
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
    const currentLocation: HexCoord = (() => {
      for (const t of Object.values(worldMap.tiles)) {
        if (this.party[0] && t.occupants.includes(this.party[0].id)) return t.coord;
      }
      return worldMap.playerStartCoord;
    })();
    const state = serialise({
      gameMode: mode,
      worldMap,
      party: this.party,
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
    const currentLocation: HexCoord = (() => {
      for (const t of Object.values(worldMap.tiles)) {
        if (this.party[0] && t.occupants.includes(this.party[0].id)) return t.coord;
      }
      return worldMap.playerStartCoord;
    })();
    const state = serialise({
      gameMode: mode,
      worldMap,
      party: this.party,
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
      () => { this.townPanel?.destroy(); this.townPanel = null; },
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
      gfx.on('pointerover', () => { gfx.setAlpha(0.8); });
      gfx.on('pointerout', () => { gfx.setAlpha(1); });
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
    if (!this.selectedChar || !tile.passable) return;

    const map = this.hexModule.store.getMap();
    let fromCoord: HexCoord | null = null;

    for (const t of Object.values(map.tiles)) {
      if (t.occupants.includes(this.selectedChar.id)) {
        fromCoord = t.coord;
        break;
      }
    }

    if (!fromCoord) return;

    const path = this.hexModule.findPath(fromCoord, tile.coord);
    if (!path || path.length === 0) return;

    const dest = path[path.length - 1];
    this.hexModule.store.moveOccupant(this.selectedChar.id, fromCoord, dest);
    this.hexModule.store.exploreTile(dest);

    // T020: Follow the character to their new tile (FR-012: player-controlled only)
    if (this.cameraController && this.isPlayerControlled(this.selectedChar)) {
      this.cameraController.followTo(dest, path.length);
    }

    // Check if destination is a town → show TownPanel
    const destTile = this.hexModule.store.getMap().tiles[`${dest.q},${dest.r}`];
    if (destTile?.poiTag === 'town') {
      const town = this.towns.find(
        (t: Town) => t.coord.q === dest.q && t.coord.r === dest.r,
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
        ?.find((ec: EnemyCamp) => ec.coord.q === dest.q && ec.coord.r === dest.r && !ec.defeated);
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
        worldMap,
        party: this.party,
        deathHistory: [],
        invalidated: false,
        towns: [],
        enemyCamps: (worldMap as unknown as { enemyCamps: EnemyCamp[] }).enemyCamps ?? [],
        activeCombat: null,
        currentLocation: dest,
        gold: this.registry.get('gold') as number ?? 0,
        metaProgression: { schemaVersion: 1 },
      });
      saveModule.autoSave(saveState).catch(console.warn);
    }

    // Tween the character sprite to the new position
    const sprite = this.charSprites.get(this.selectedChar.id);
    if (sprite) {
      const { x, y } = toPixel(dest, TILE_SIZE);
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
    if (this.statPanel) this.statPanel.destroy();
    if (this.modeLabel) this.modeLabel.destroy();
    if (this.saveBar) { this.saveBar.remove(); this.saveBar = null; }
    if (this.townPanel) { this.townPanel.destroy(); this.townPanel = null; }
    // T031: Remove re-center button DOM element
    if (this.reCenterBtn) { this.reCenterBtn.remove(); this.reCenterBtn = null; }
  }
}
