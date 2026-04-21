import type { ClassDefinition } from '../../models/class';

type PromotionCallback = (chosen: ClassDefinition) => void;

/**
 * PromotionModal: shows promotion class options with stat previews.
 * Waits for player selection; calls callback with the chosen ClassDefinition.
 */
export class PromotionModal {
  private el: HTMLDivElement | null = null;

  show(
    characterName: string,
    options: ClassDefinition[],
    onChoose: PromotionCallback,
  ): void {
    this.dismiss();

    const el = document.createElement('div');
    el.id = 'promotion-modal';
    el.className = 'fixed inset-0 flex items-center justify-center z-50 pointer-events-auto bg-black bg-opacity-80';

    const cards = options
      .map(
        (cls) => `
        <button data-class-id="${cls.id}"
          class="promotion-option bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-yellow-500 text-left rounded-xl p-4 transition-colors w-48">
          <div class="text-yellow-300 font-bold text-lg mb-1">${cls.name}</div>
          <div class="text-gray-400 text-xs mb-3">${cls.tier} class</div>
          <div class="text-xs space-y-0.5 text-gray-300">
            <div>STR ${cls.baseStats.str} · DEX ${cls.baseStats.dex}</div>
            <div>CON ${cls.baseStats.con} · INT ${cls.baseStats.int}</div>
            <div>WIS ${cls.baseStats.wis} · CHA ${cls.baseStats.cha}</div>
            <div class="text-blue-300 mt-1">HP Base: ${cls.maxHpBase}</div>
          </div>
        </button>
      `,
      )
      .join('');

    el.innerHTML = `
      <div class="bg-gray-900 border-2 border-purple-600 rounded-2xl p-6 shadow-2xl">
        <div class="text-purple-300 text-2xl font-bold mb-2 text-center">Promotion!</div>
        <div class="text-gray-300 text-sm text-center mb-5">${characterName} can promote — choose a class</div>
        <div class="flex gap-4">${cards}</div>
      </div>
    `;
    document.body.appendChild(el);
    this.el = el;

    el.querySelectorAll<HTMLButtonElement>('.promotion-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const classId = btn.dataset.classId!;
        const chosen = options.find((c) => c.id === classId)!;
        this.dismiss();
        onChoose(chosen);
      });
    });
  }

  dismiss(): void {
    if (this.el) { this.el.remove(); this.el = null; }
  }

  destroy(): void { this.dismiss(); }
}
