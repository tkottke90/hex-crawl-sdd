import type { Attributes } from '../../models/attributes';

/**
 * LevelUpOverlay: shows stat diffs on level-up.
 * Auto-dismisses after 3 seconds or on click.
 */
export class LevelUpOverlay {
  private el: HTMLDivElement | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  show(characterName: string, newLevel: number, statDeltas: Partial<Attributes>): void {
    this.dismiss();

    const el = document.createElement('div');
    el.id = 'levelup-overlay';
    el.className = 'fixed inset-0 flex items-center justify-center z-50 pointer-events-auto bg-black bg-opacity-70';

    const deltaRows = (Object.entries(statDeltas) as [string, number][])
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `<div class="flex justify-between text-sm"><span class="text-gray-300 uppercase">${k}</span><span class="text-green-400 font-bold">+${v}</span></div>`)
      .join('');

    el.innerHTML = `
      <div class="bg-gray-900 border-2 border-yellow-500 rounded-2xl p-6 w-72 text-center shadow-2xl">
        <div class="text-yellow-400 text-3xl font-bold mb-1">Level Up!</div>
        <div class="text-gray-300 text-sm mb-4">${characterName} → Level ${newLevel}</div>
        <div class="space-y-1 mb-5">${deltaRows || '<div class="text-gray-500 text-sm">No stat increases</div>'}</div>
        <p class="text-gray-500 text-xs">Click to continue</p>
      </div>
    `;
    document.body.appendChild(el);
    this.el = el;

    el.addEventListener('click', () => this.dismiss());
    this.timer = setTimeout(() => this.dismiss(), 3000);
  }

  dismiss(): void {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.el) { this.el.remove(); this.el = null; }
  }

  destroy(): void { this.dismiss(); }
}
