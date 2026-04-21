import type { Character } from '../../models/character';
import { onProgressionEvent } from '../../modules/progression/ProgressionService';

/**
 * StatPanel: Tailwind HTML overlay showing the selected character's stats.
 * pointer-events-none on the container; the panel itself is interactive.
 */
export class StatPanel {
  private el: HTMLDivElement;
  private partyRef: Character[] = [];

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'stat-panel';
    this.el.className = 'fixed bottom-4 left-4 pointer-events-none z-30';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    // T058: re-render on progression events
    onProgressionEvent((_event, payload) => {
      const p = payload as { characterId?: string } | null;
      if (!p?.characterId) return;
      // Find updated character in party
      const updated = this.partyRef.find((c) => c.id === p.characterId);
      if (updated) this.render(updated);
    });
  }

  /** Set party reference so StatPanel can find updated characters after level-up/promotion. */
  setParty(party: Character[]): void {
    this.partyRef = party;
  }

  render(character: Character): void {
    const hpPct = Math.max(0, Math.round((character.hp / character.maxHp) * 100));
    this.el.style.display = '';
    this.el.innerHTML = `
      <div class="bg-gray-900 bg-opacity-90 border border-gray-600 rounded-xl p-4 w-56 pointer-events-auto">
        <div class="flex justify-between items-center mb-2">
          <span class="text-yellow-400 font-bold text-base">${character.name}</span>
          <span class="text-gray-400 text-xs uppercase">${character.classId} Lv${character.level}</span>
        </div>
        <div class="mb-3">
          <div class="flex justify-between text-xs text-gray-400 mb-1">
            <span>HP</span><span>${character.hp}/${character.maxHp}</span>
          </div>
          <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-green-500 transition-all" style="width:${hpPct}%"></div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-1 text-xs">
          ${Object.entries(character.attributes).map(([k, v]) => `
            <div class="text-center"><span class="text-gray-400 uppercase">${k}</span><br/><span class="text-white font-bold">${v}</span></div>
          `).join('')}
        </div>
      </div>
    `;
  }

  hide(): void {
    this.el.style.display = 'none';
  }

  destroy(): void {
    this.el.remove();
  }
}
