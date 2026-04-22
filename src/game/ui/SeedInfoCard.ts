import type { GameModeType } from '../../models/save';

/**
 * Card-style HUD element showing game mode and map seed.
 * Replaces ModeLabel in WorldMap.ts.
 * pointer-events-none — never blocks interaction.
 */
export class SeedInfoCard {
  private el: HTMLDivElement;

  constructor(mode: GameModeType, seed: string) {
    this.el = document.createElement('div');
    this.el.id = 'seed-info-card';
    this.el.className =
      'fixed top-3 right-3 bg-gray-900 bg-opacity-90 border border-gray-600 rounded-xl p-4 w-56 pointer-events-none z-50';

    const isCasual = mode === 'casual';
    const modeLabel = isCasual ? 'CASUAL' : 'ROGUELIKE';
    const modeColor = isCasual
      ? 'bg-green-700 text-green-200'
      : 'bg-red-800 text-red-200';

    const modePill = document.createElement('div');
    modePill.setAttribute('data-mode', mode);
    modePill.className = `${modeColor} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-2`;
    modePill.textContent = modeLabel;

    const seedRow = document.createElement('div');
    seedRow.className = 'flex justify-between text-xs mt-1';

    const seedLabel = document.createElement('span');
    seedLabel.className = 'text-gray-400 uppercase tracking-wider';
    seedLabel.textContent = 'Seed';

    const seedValue = document.createElement('span');
    seedValue.className = 'text-white font-mono text-right truncate ml-2 max-w-[120px]';
    seedValue.textContent = seed;

    seedRow.appendChild(seedLabel);
    seedRow.appendChild(seedValue);

    this.el.appendChild(modePill);
    this.el.appendChild(seedRow);

    document.body.appendChild(this.el);
  }

  destroy(): void {
    this.el.remove();
  }
}
