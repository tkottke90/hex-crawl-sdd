import * as Phaser from 'phaser';
import type { Character } from '../../models/character';
import type { EnemyUnit } from '../../models/enemy';
import { applyCombatReturnState } from '../../modules/world-map/CombatReturnState';

export interface VictorySummaryData {
  playerUnits: Character[];
  enemyUnits: EnemyUnit[];
  encounterId: string;
}

/**
 * VictorySummary scene: shown after player wins combat.
 * Displays enemies defeated, any character deaths, and a Continue button.
 * On Continue, emits map:clear-enemy-tile and returns to WorldMap.
 */
export class VictorySummary extends Phaser.Scene {
  private overlay: HTMLDivElement | null = null;

  constructor() {
    super({ key: 'VictorySummary' });
  }

  create(data: VictorySummaryData): void {
    this.showSummary(data);
  }

  private showSummary(data: VictorySummaryData): void {
    const el = document.createElement('div');
    el.id = 'victory-summary';
    el.className = 'fixed inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-95 z-50';

    const deaths = data.playerUnits.filter((c) => c.status === 'dead');

    const deathRows = deaths.length > 0
      ? deaths.map((c) => `<div class="text-red-400 text-sm">💀 ${c.name} fell in battle</div>`).join('')
      : '<div class="text-green-400 text-sm">No casualties</div>';

    el.innerHTML = `
      <div class="text-yellow-400 text-4xl font-bold mb-6">VICTORY!</div>
      <div class="bg-gray-800 rounded-xl p-6 w-80 mb-6 space-y-3">
        <div class="text-white font-semibold mb-3">Battle Report</div>
        <div class="text-gray-300 text-sm">Enemies defeated: ${data.enemyUnits.length}</div>
        <div class="border-t border-gray-700 pt-3">${deathRows}</div>
      </div>
      <button id="btn-victory-continue"
        class="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-lg text-lg">
        Continue
      </button>
    `;
    document.body.appendChild(el);
    this.overlay = el;

    document.getElementById('btn-victory-continue')!.addEventListener('click', () => {
      this.registry.events.emit('map:clear-enemy-tile', { encounterId: data.encounterId });
      const currentSave = this.registry.get('saveState');
      if (currentSave) {
        const updatedSave = applyCombatReturnState(currentSave, data.playerUnits);
        this.registry.set('saveState', updatedSave);
        this.registry.set('worldMap', updatedSave.worldMap);
      }
      this.cleanup();
      this.registry.set('worldMapTurnRefresh', true);
      this.scene.start('WorldMap');
    });
  }

  private cleanup(): void {
    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
  }

  shutdown(): void {
    this.cleanup();
  }
}
