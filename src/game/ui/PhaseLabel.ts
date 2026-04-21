import type { CombatPhase } from '../../models/combat';

/**
 * PhaseLabel: Always-visible HUD element in combat showing current phase.
 */
export class PhaseLabel {
  private el: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'phase-label';
    this.el.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none';
    document.body.appendChild(this.el);
    this.update('player', 1);
  }

  update(phase: CombatPhase, round: number): void {
    const isPlayer = phase === 'player';
    const label = isPlayer ? 'PLAYER PHASE' : phase === 'enemy' ? 'ENEMY PHASE' : 'RESOLUTION';
    const colorClass = isPlayer
      ? 'bg-blue-600 text-white'
      : phase === 'enemy'
        ? 'bg-red-700 text-white'
        : 'bg-gray-700 text-white';

    this.el.innerHTML = `
      <div class="${colorClass} px-6 py-2 rounded-full font-bold text-sm tracking-widest shadow-lg">
        ${label}
        <span class="ml-3 text-xs opacity-75">Round ${round}</span>
      </div>
    `;
  }

  destroy(): void {
    this.el.remove();
  }
}
