import * as Phaser from 'phaser';
import type { Character, DeathRecord } from '../../models/character';
import type { GameModeType } from '../../models/save';

interface RunEndData {
  reason: 'pc-died' | 'escort-died';
  party: Character[];
  deathHistory: DeathRecord[];
  turnsElapsed: number;
  enemiesDefeated: number;
  mode: GameModeType;
}

/**
 * RunEnd scene — shown when PC or Escort dies in either mode.
 * Casual: Return to Menu (can reload save from there).
 * Roguelike: Return to Menu (save is already invalidated by Combat.ts).
 */
export class RunEnd extends Phaser.Scene {
  private overlay: HTMLDivElement | null = null;

  constructor() {
    super({ key: 'RunEnd' });
  }

  create(): void {
    const data = this.scene.settings.data as RunEndData;
    this.showRunEndScreen(data);
  }

  private showRunEndScreen(data: RunEndData): void {
    const { reason, party, deathHistory, turnsElapsed, enemiesDefeated, mode } = data;

    const title = reason === 'pc-died' ? 'Journey Over' : 'Mission Failed';
    const subtitle =
      reason === 'pc-died'
        ? 'Your hero has fallen.'
        : 'The escort has been lost.';

    const deathRows = deathHistory
      .map(
        (d) =>
          `<div class="text-sm text-gray-400">Fallen hero <span class="text-gray-600">— Turn ${d.turn}</span></div>`,
      ).join('') || '<div class="text-sm text-gray-500 italic">None</div>';

    const rosterRows = party
      .map((ch) => {
        const statusColor = ch.status === 'dead' ? 'text-red-400' : 'text-green-400';
        return `<div class="text-sm"><span class="${statusColor}">${ch.name}</span> <span class="text-gray-500">Lv${ch.level} ${ch.classId}</span></div>`;
      })
      .join('');

    const roguelikeNote =
      mode === 'roguelike'
        ? '<p class="text-red-400 text-sm mt-4 font-semibold">Roguelike: this save has been invalidated.</p>'
        : '<p class="text-gray-400 text-sm mt-4">You may reload a previous save from the Main Menu.</p>';

    const el = document.createElement('div');
    el.className =
      'fixed inset-0 flex flex-col items-center justify-center bg-gray-950 bg-opacity-95 z-50 overflow-auto py-8';
    el.innerHTML = `
      <h1 class="text-red-500 text-5xl font-bold mb-2 tracking-widest">${title}</h1>
      <p class="text-gray-400 mb-8">${subtitle}</p>

      <div class="bg-gray-800 rounded-xl p-6 w-96 mb-4">
        <div class="grid grid-cols-2 gap-4 text-center mb-4">
          <div>
            <div class="text-yellow-400 text-2xl font-bold">${turnsElapsed}</div>
            <div class="text-gray-500 text-xs uppercase">Turns</div>
          </div>
          <div>
            <div class="text-yellow-400 text-2xl font-bold">${enemiesDefeated}</div>
            <div class="text-gray-500 text-xs uppercase">Enemies Defeated</div>
          </div>
        </div>

        <div class="border-t border-gray-700 pt-4 mb-4">
          <div class="text-gray-300 text-xs uppercase mb-2 font-semibold">Party</div>
          ${rosterRows}
        </div>

        <div class="border-t border-gray-700 pt-4">
          <div class="text-gray-300 text-xs uppercase mb-2 font-semibold">Fallen Heroes</div>
          ${deathRows}
        </div>
      </div>

      ${roguelikeNote}

      <button id="btn-return-menu" class="mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg text-lg">
        Return to Menu
      </button>
    `;
    document.body.appendChild(el);
    this.overlay = el;

    document.getElementById('btn-return-menu')!.addEventListener('click', () => {
      this.clearOverlay();
      // Clear save state so MainMenu starts fresh
      this.registry.remove('saveState');
      this.scene.start('MainMenu');
    });
  }

  private clearOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  shutdown(): void {
    this.clearOverlay();
  }
}
