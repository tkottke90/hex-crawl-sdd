import type { Character } from '../../models/character';
import type { GameMode } from '../../models/save';
import type { HexCoord } from '../../models/hex';

export class ModeRules {
  /**
   * Pure function. Returns a new Character with status 'dead' and deathRecord set.
   * Mode difference is purely save behavior — character status is always 'dead' at 0 HP.
   */
  static applyDefeat(
    character: Character,
    _mode: GameMode,
    coord: HexCoord,
    turn: number,
  ): Character {
    return { ...character, status: 'dead', deathRecord: { coord, turn } };
  }
}
