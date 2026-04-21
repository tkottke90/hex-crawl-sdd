import type { Character } from '../../models/character';
import type { SaveState, GameMode } from '../../models/save';

/**
 * Check if the run should end.
 * Returns true if any PC or Escort in the party has status === 'dead'.
 * Pure function — no mode parameter needed (mode only affects save behavior).
 */
export function checkRunEnd(party: Character[]): boolean {
  return party.some(
    (ch) => (ch.role === 'pc' || ch.role === 'escort') && ch.status === 'dead',
  );
}

/**
 * Invalidate the save state if the current game mode is roguelike.
 * Returns a new SaveState with `invalidated: true` when mode is 'roguelike'.
 * In Casual mode, save is NOT invalidated so players can reload.
 * Pure function.
 */
export function invalidateSave(saveState: SaveState, mode: GameMode): SaveState {
  if (mode.type !== 'roguelike') return saveState;
  return { ...saveState, invalidated: true };
}
