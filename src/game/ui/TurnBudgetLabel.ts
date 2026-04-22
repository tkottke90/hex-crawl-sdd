export class TurnBudgetLabel {
  private el: HTMLDivElement;
  private valueEl: HTMLSpanElement;

  constructor(initialRemaining: number, onEndTurn: () => void) {
    this.el = document.createElement('div');
    this.el.id = 'turn-budget-label';
    this.el.className = 'fixed top-3 left-3 z-50 flex items-center gap-3 rounded-full border border-yellow-500/40 bg-gray-900/90 px-4 py-2 text-xs text-yellow-100 shadow-lg backdrop-blur pointer-events-auto';

    this.el.innerHTML = `
      <div class="flex items-center gap-2 px-4 py-2">
        <span class="font-semibold uppercase tracking-[0.25em] text-yellow-300">Turn</span>
        <span data-role="turn-budget-value" class="min-w-6 text-sm font-bold text-white"></span>
      </div>
      <button
        type="button"
        data-role="end-turn-button"
        class="rounded-full bg-yellow-500 px-3 py-1 font-bold text-gray-950 transition hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-300"
      >
        End Turn
      </button>
    `;

    this.valueEl = this.el.querySelector('[data-role="turn-budget-value"]') as HTMLSpanElement;
    const button = this.el.querySelector('[data-role="end-turn-button"]') as HTMLButtonElement;
    button.addEventListener('click', onEndTurn);

    document.body.appendChild(this.el);
    this.update(initialRemaining);
  }

  update(remaining: number): void {
    this.valueEl.textContent = String(Math.max(0, Math.floor(remaining)));
    this.el.dataset.remaining = String(Math.max(0, Math.floor(remaining)));
  }

  destroy(): void {
    this.el.remove();
  }
}
