import * as Phaser from 'phaser';
import { createCombatModule, type EncounterConfig, type CombatModule } from '../../modules/combat/index';
import { createProgressionModule } from '../../modules/progression/index';
import { checkRunEnd, invalidateSave } from '../../modules/combat/RunEndDetector';
import { createSaveModule } from '../../modules/save';
import { PRNG } from '../../utils/prng';
import { DiceRollOverlay } from '../ui/DiceRollOverlay';
import { PhaseLabel } from '../ui/PhaseLabel';
import { StatPanel } from '../ui/StatPanel';
import { ModeLabel } from '../ui/ModeLabel';
import { LevelUpOverlay } from '../ui/LevelUpOverlay';
import { PromotionModal } from '../ui/PromotionModal';
import { BASE_CLASSES, PROMOTED_CLASSES, getClassById } from '../../data/classes';
import type { Character } from '../../models/character';
import type { EnemyUnit } from '../../models/enemy';
import type { GameMode } from '../../models/save';
import type { DiceRoll } from '../../models/combat';

const { module: saveModule } = createSaveModule();

export interface CombatSceneData {
  playerUnits: Character[];
  enemyUnits: EnemyUnit[];
  mode: GameMode;
  encounterId: string;
}

const TILE_SIZE = 48;
const GRID_RADIUS = 4; // small tactical grid

export class Combat extends Phaser.Scene {
  private combatModule!: CombatModule;
  private playerUnits: Character[] = [];
  private enemyUnits: EnemyUnit[] = [];
  private selectedUnitId: string | null = null;

  // UI
  private diceOverlay!: DiceRollOverlay;
  private phaseLabel!: PhaseLabel;
  private statPanel!: StatPanel;
  private modeLabel!: ModeLabel;
  private levelUpOverlay!: LevelUpOverlay;
  private promotionModal!: PromotionModal;
  private actionBar: HTMLDivElement | null = null;
  private gameMode!: GameMode;

  constructor() {
    super({ key: 'Combat' });
  }

  create(data: CombatSceneData): void {
    const mode = data.mode;
    this.gameMode = mode;
    const prng = new PRNG(`combat_${Date.now()}`);

    const config: EncounterConfig = {
      playerUnits: data.playerUnits,
      enemyUnits: data.enemyUnits,
      friendlyNpcs: [],
      mapContext: this.registry.get('worldMap'),
    };

    const { module, onEvent } = createCombatModule(config, mode, prng);
    this.combatModule = module;
    this.playerUnits = data.playerUnits;
    this.enemyUnits = data.enemyUnits;

    onEvent((event, payload) => this.handleCombatEvent(event, payload as Record<string, unknown>));

    this.diceOverlay = new DiceRollOverlay();
    this.phaseLabel = new PhaseLabel();
    this.statPanel = new StatPanel();
    this.modeLabel = new ModeLabel(mode.type);
    this.levelUpOverlay = new LevelUpOverlay();
    this.promotionModal = new PromotionModal();

    this.renderGrid();
    this.renderUnits();
    this.renderActionBar();

    // Auto-select first player unit
    if (this.playerUnits[0]) {
      this.selectedUnitId = this.playerUnits[0].id;
      this.statPanel.render(this.playerUnits[0]);
    }
  }

  private renderGrid(): void {
    // Simple tactical hex grid centered on screen
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    for (let q = -GRID_RADIUS; q <= GRID_RADIUS; q++) {
      for (let r = -GRID_RADIUS; r <= GRID_RADIUS; r++) {
        const s = -q - r;
        if (Math.abs(s) > GRID_RADIUS) continue;
        const x = cx + TILE_SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const y = cy + TILE_SIZE * (3 / 2 * r);

        const gfx = this.add.graphics();
        gfx.lineStyle(1, 0x444444, 1);
        gfx.fillStyle(0x2a3a2a, 1);
        this.drawHex(gfx, x, y, TILE_SIZE - 3);
      }
    }
  }

  private drawHex(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number, size: number): void {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      pts.push({ x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) });
    }
    gfx.fillPoints(pts as Phaser.Math.Vector2[], true);
    gfx.strokePoints(pts as Phaser.Math.Vector2[], true);
  }

  private renderUnits(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Place player units on left half, enemies on right
    this.playerUnits.forEach((ch, i) => {
      const x = cx - TILE_SIZE * 2;
      const y = cy + i * TILE_SIZE * 1.8 - (this.playerUnits.length - 1) * TILE_SIZE * 0.9;
      const sprite = this.add.image(x, y, ch.portrait).setScale(0.8).setInteractive();
      sprite.on('pointerdown', () => {
        this.selectedUnitId = ch.id;
        this.statPanel.render(ch);
      });
    });

    this.enemyUnits.forEach((e, i) => {
      const x = cx + TILE_SIZE * 2;
      const y = cy + i * TILE_SIZE * 1.8 - (this.enemyUnits.length - 1) * TILE_SIZE * 0.9;
      this.add.image(x, y, 'char-pc').setScale(0.8).setTint(0xff4444).setInteractive()
        .on('pointerdown', () => this.attackTarget(e.id));
    });
  }

  private renderActionBar(): void {
    if (this.actionBar) this.actionBar.remove();
    const bar = document.createElement('div');
    bar.id = 'combat-action-bar';
    bar.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-30';
    bar.innerHTML = `
      <button id="btn-attack" class="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-lg">Attack</button>
      <button id="btn-wait" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-lg">Wait</button>
      <button id="btn-use-item" class="bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold py-2 px-5 rounded-lg" title="No items in v1">Use Item</button>
      <button id="btn-end-phase" class="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg">End Phase</button>
    `;
    document.body.appendChild(bar);
    this.actionBar = bar;

    document.getElementById('btn-attack')!.addEventListener('click', () => this.attackFirstEnemy());
    document.getElementById('btn-wait')!.addEventListener('click', () => this.waitUnit());
    document.getElementById('btn-use-item')!.addEventListener('click', () => this.showNoItemsToast());
    document.getElementById('btn-end-phase')!.addEventListener('click', () => this.endPhase());
  }

  private attackFirstEnemy(): void {
    if (!this.selectedUnitId) return;
    const enemy = this.enemyUnits.find((e) => e.hp > 0);
    if (enemy) this.attackTarget(enemy.id);
  }

  private attackTarget(targetId: string): void {
    if (!this.selectedUnitId) return;
    const result = this.combatModule.attack(this.selectedUnitId, targetId);
    if (result.success && result.roll) {
      this.diceOverlay.show(result.roll);
    }
    // Refresh unit list from module
    this.enemyUnits = this.combatModule.getEnemyUnits();
    this.playerUnits = this.combatModule.getPlayerUnits();
  }

  private waitUnit(): void {
    if (!this.selectedUnitId) return;
    this.combatModule.wait(this.selectedUnitId);
  }

  private endPhase(): void {
    this.combatModule.endPlayerPhase();
    this.phaseLabel.update('enemy', 1);
  }

  private showNoItemsToast(): void {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-300 text-sm px-4 py-2 rounded-lg z-50';
    toast.textContent = 'No items available';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
  }

  private handleCombatEvent(event: string, payload: Record<string, unknown>): void {
    switch (event) {
      case 'combat:action': {
        const entry = payload.entry as { roll: DiceRoll | null } | undefined;
        if (entry?.roll) this.diceOverlay.show(entry.roll);
        break;
      }
      case 'combat:phase-changed': {
        const phase = payload.phase as string;
        const round = payload.round as number;
        if (phase === 'player') this.phaseLabel.update('player', round);
        else if (phase === 'enemy') this.phaseLabel.update('enemy', round);
        break;
      }
      case 'combat:resolved': {
        const resolution = payload.resolution as { outcome: string } | undefined;
        if (resolution?.outcome === 'player-victory') {
          this.time.delayedCall(500, () => this.endCombatVictory());
        } else if (resolution?.outcome === 'player-defeat') {
          this.time.delayedCall(500, () => this.endCombatDefeat());
        }
        break;
      }
    }
  }

  private endCombatVictory(): void {
    const prng = new PRNG(`progression_${Date.now()}`);
    const { module: progressionModule } = createProgressionModule();
    const allClassDefs = [...BASE_CLASSES, ...PROMOTED_CLASSES];
    const xpPerEnemy = 30;
    const totalXp = this.enemyUnits.length * xpPerEnemy;

    let updatedUnits = this.combatModule.getPlayerUnits();
    const levelUpQueue: { char: Character; newLevel: number; deltas: Record<string, number> }[] = [];
    const promotionQueue: { char: Character }[] = [];

    for (let i = 0; i < updatedUnits.length; i++) {
      let ch = updatedUnits[i];
      if (ch.status === 'dead') continue;
      const withXp = progressionModule.awardXp(ch, totalXp);
      if (withXp.level > ch.level) {
        const classDef = getClassById(ch.classId) ?? BASE_CLASSES[0];
        const levelled = progressionModule.applyLevelUp(withXp, classDef, prng);
        const promotionOptions = progressionModule.getPromotionOptions(levelled, classDef, allClassDefs);
        levelUpQueue.push({ char: levelled, newLevel: levelled.level, deltas: {} });
        if (promotionOptions.length > 0) promotionQueue.push({ char: levelled });
        ch = levelled;
      } else {
        ch = withXp;
      }
      updatedUnits[i] = ch;
    }

    const showPromotions = (idx: number) => {
      if (idx >= promotionQueue.length) {
        this.finishVictory(updatedUnits);
        return;
      }
      const entry = promotionQueue[idx];
      const classDef = getClassById(entry.char.classId) ?? BASE_CLASSES[0];
      const options = progressionModule.getPromotionOptions(entry.char, classDef, allClassDefs);
      this.promotionModal.show(entry.char.name, options, (chosen) => {
        const promoted = progressionModule.applyPromotion(entry.char, chosen);
        const unitIdx = updatedUnits.findIndex((u) => u.id === entry.char.id);
        if (unitIdx !== -1) updatedUnits[unitIdx] = promoted;
        showPromotions(idx + 1);
      });
    };

    const showLevelUps = (idx: number) => {
      if (idx >= levelUpQueue.length) { showPromotions(0); return; }
      const entry = levelUpQueue[idx];
      this.levelUpOverlay.show(entry.char.name, entry.newLevel, entry.deltas);
      setTimeout(() => showLevelUps(idx + 1), 3200);
    };

    showLevelUps(0);
  }

  private finishVictory(updatedUnits: Character[]): void {
    this.cleanup();
    const encounterId = this.scene.settings.data
      ? (this.scene.settings.data as CombatSceneData).encounterId
      : '';
    this.scene.start('VictorySummary', {
      playerUnits: updatedUnits,
      enemyUnits: this.combatModule.getEnemyUnits(),
      encounterId,
    });
  }

  private endCombatDefeat(): void {
    const party = this.combatModule.getPlayerUnits();
    const runEnded = checkRunEnd(party);
    const reason: 'pc-died' | 'escort-died' = party.some(
      (ch) => ch.role === 'pc' && ch.status === 'dead',
    ) ? 'pc-died' : 'escort-died';

    if (runEnded) {
      // Persist invalidated save for roguelike
      const currentSave = this.registry.get('saveState');
      if (currentSave) {
        const invalidated = invalidateSave(currentSave, this.gameMode);
        if (this.gameMode.type === 'roguelike') {
          saveModule.saveToStorage(invalidated).catch(console.warn);
        }
      }
      this.cleanup();
      this.scene.start('RunEnd', {
        reason,
        party,
        deathHistory: party.filter((ch) => ch.deathRecord != null).map((ch) => ch.deathRecord!),
        turnsElapsed: 0, // TODO: track turns in future
        enemiesDefeated: this.enemyUnits.filter((e) => e.hp <= 0).length,
        mode: this.gameMode.type,
      });
    } else {
      this.cleanup();
      this.scene.start('WorldMap');
    }
  }

  private cleanup(): void {
    this.diceOverlay.destroy();
    this.phaseLabel.destroy();
    this.statPanel.destroy();
    this.modeLabel.destroy();
    this.levelUpOverlay.destroy();
    this.promotionModal.destroy();
    if (this.actionBar) { this.actionBar.remove(); this.actionBar = null; }
  }

  shutdown(): void {
    this.cleanup();
  }
}
