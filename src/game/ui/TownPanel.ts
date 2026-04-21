import type { HireableHero } from '../../models/town';
import type { Character } from '../../models/character';

const PARTY_CAP = 8;

export class TownPanel {
  private el: HTMLDivElement;
  private onHire: (hero: HireableHero) => void;

  constructor(
    hirePool: HireableHero[],
    party: Character[],
    currentGold: number,
    onHire: (hero: HireableHero) => void,
    onClose: () => void,
  ) {
    this.onHire = onHire;
    this.el = document.createElement('div');
    this.el.id = 'town-panel';
    this.el.className =
      'fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-40';

    const rows = hirePool
      .map((hero, i) => {
        const isFull = party.length >= PARTY_CAP;
        const canAfford = currentGold >= hero.hireCost;
        const disabled = isFull || !canAfford ? 'disabled opacity-50 cursor-not-allowed' : '';
        const reason = isFull ? 'Party Full' : !canAfford ? 'Need Gold' : '';
        return `
          <div class="flex items-center justify-between bg-gray-700 rounded-lg p-3 gap-4">
            <div>
              <div class="text-yellow-300 font-bold">${hero.characterTemplate.name}</div>
              <div class="text-xs text-gray-400">Lv${hero.characterTemplate.level} ${hero.characterTemplate.classId}</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-yellow-400 text-sm font-semibold">${hero.hireCost}g</span>
              ${reason ? `<span class="text-red-400 text-xs">${reason}</span>` : ''}
              <button
                data-hero-index="${i}"
                class="hire-btn bg-green-700 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded ${disabled}"
                ${disabled ? 'disabled' : ''}
              >Hire</button>
            </div>
          </div>
        `;
      })
      .join('');

    const empty =
      hirePool.length === 0
        ? '<p class="text-gray-500 italic text-sm">No heroes for hire.</p>'
        : '';

    this.el.innerHTML = `
      <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 w-96 shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-white text-xl font-bold">Town — Hire Heroes</h2>
          <span class="text-yellow-400 font-semibold">${currentGold}g</span>
        </div>
        <div class="flex flex-col gap-2 mb-4">${rows}${empty}</div>
        <button id="town-panel-close" class="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm">Close</button>
      </div>
    `;

    document.body.appendChild(this.el);

    this.el.querySelectorAll('.hire-btn:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).dataset.heroIndex ?? '0', 10);
        this.onHire(hirePool[idx]);
      });
    });

    document.getElementById('town-panel-close')!.addEventListener('click', () => {
      onClose();
    });
  }

  destroy(): void {
    this.el.remove();
  }
}
