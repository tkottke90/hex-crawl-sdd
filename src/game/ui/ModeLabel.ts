import type { GameModeType } from '../../models/save';

/**
 * Persistent HUD badge showing game mode.
 * pointer-events-none — never blocks interaction.
 */
export class ModeLabel {
  private el: HTMLDivElement;

  constructor(mode: GameModeType) {
    this.el = document.createElement('div');
    this.el.id = 'mode-label';
    const isCasual = mode === 'casual';
    const label = isCasual ? 'CASUAL' : 'ROGUELIKE';
    const color = isCasual ? 'bg-green-700 text-green-200' : 'bg-red-800 text-red-200';
    this.el.className = `fixed top-3 right-3 ${color} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest pointer-events-none z-50`;
    this.el.textContent = label;
    document.body.appendChild(this.el);
  }

  destroy(): void {
    this.el.remove();
  }
}
