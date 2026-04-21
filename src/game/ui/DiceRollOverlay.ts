import type { DiceRoll } from '../../models/combat';

/**
 * DiceRollOverlay: Tailwind HTML overlay displaying a single DiceRoll result.
 * Auto-dismisses after 2 seconds or on click.
 */
export class DiceRollOverlay {
  private el: HTMLDivElement | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  show(roll: DiceRoll): void {
    this.dismiss();

    const el = document.createElement('div');
    el.id = 'dice-overlay';
    el.className = `
      fixed inset-0 flex items-center justify-center z-50 pointer-events-auto
      bg-black bg-opacity-60
    `.trim();

    const badge = roll.isCritical
      ? '<span class="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full ml-2">CRIT!</span>'
      : roll.isFumble
        ? '<span class="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">FUMBLE</span>'
        : '';

    const diceValues = roll.dice
      .map((d, i) => `<span class="text-2xl font-bold text-yellow-300">${d}</span>${i < roll.dice.length - 1 ? '<span class="text-gray-400 mx-1">+</span>' : ''}`)
      .join('');

    el.innerHTML = `
      <div class="bg-gray-900 border border-gray-600 rounded-2xl p-6 w-72 text-center shadow-2xl">
        <div class="flex items-center justify-center mb-3">
          <span class="text-gray-400 text-sm uppercase tracking-widest">${roll.type}</span>
          ${badge}
        </div>
        <div class="text-xs text-gray-500 mb-2">${roll.notation}</div>
        <div class="flex items-center justify-center gap-1 mb-3">${diceValues}</div>
        ${roll.modifier !== 0 ? `<div class="text-gray-400 text-sm mb-2">Modifier: ${roll.modifier >= 0 ? '+' : ''}${roll.modifier}</div>` : ''}
        <div class="text-white text-4xl font-bold mb-4">${roll.total}</div>
        <p class="text-gray-500 text-xs">Click to dismiss</p>
      </div>
    `;

    document.body.appendChild(el);
    this.el = el;

    el.addEventListener('click', () => this.dismiss());
    this.dismissTimer = setTimeout(() => this.dismiss(), 2000);
  }

  dismiss(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
  }

  destroy(): void {
    this.dismiss();
  }
}
