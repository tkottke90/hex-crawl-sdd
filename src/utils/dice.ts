import type { DiceRoll } from '../models/combat';
import type { PRNG } from './prng';

const NOTATION_RE = /^(\d+)d(\d+)([+-]\d+)?$/i;

export class DiceRoller {
  roll(notation: string, prng: PRNG): DiceRoll {
    const match = NOTATION_RE.exec(notation.trim());
    if (!match) {
      throw new Error(`Invalid dice notation: "${notation}"`);
    }
    const count = parseInt(match[1], 10);
    const faces = parseInt(match[2], 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    const dice: number[] = [];
    for (let i = 0; i < count; i++) {
      dice.push(prng.nextInt(1, faces));
    }

    const total = dice.reduce((a, b) => a + b, 0) + modifier;

    // Critical: any single die shows max value (nat 20 equivalent)
    const isCritical = dice.some((d) => d === faces);
    // Fumble: any single die shows 1 (nat 1 equivalent)
    const isFumble = dice.some((d) => d === 1);

    return {
      type: 'attack',
      notation,
      dice,
      modifier,
      total,
      isCritical,
      isFumble,
    };
  }
}
