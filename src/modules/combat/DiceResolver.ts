import type { Character } from '../../models/character';
import type { DiceRoll } from '../../models/combat';
import type { PRNG } from '../../utils/prng';

export interface AttackResult {
  roll: DiceRoll;
  damageDone: number;
  targetHpAfter: number;
  targetDefeated: boolean;
}

function hitBonus(ch: Character): number {
  return Math.floor((ch.attributes.str - 10) / 2);
}
function defenseBonus(ch: Character): number {
  return Math.floor((ch.attributes.dex - 10) / 2);
}

export class DiceResolver {
  /**
   * Resolves an attack action. Does NOT mutate inputs.
   * Attack formula: roll 1d20; hit if roll + hitBonus >= 10 + defenseBonus.
   * Nat 20 → isCritical (double damage dice). Nat 1 → isFumble (auto-miss).
   * Damage: 1d6 + hitBonus (doubled dice on crit).
   */
  resolveAttack(attacker: Character, defender: Character, prng: PRNG): AttackResult {
    const attackBonus = hitBonus(attacker);
    const defBonus = defenseBonus(defender);
    const dc = 10 + defBonus;

    // Roll 1d20
    const attackDie = prng.nextInt(1, 20);
    const isFumble = attackDie === 1;
    const isCritical = attackDie === 20;

    const attackTotal = attackDie + attackBonus;
    const hit = !isFumble && (attackTotal >= dc);

    // Damage: 1d6 (doubled dice on crit)
    const damageRolls: number[] = [];
    const diceCount = isCritical ? 2 : 1;
    for (let i = 0; i < diceCount; i++) {
      damageRolls.push(prng.nextInt(1, 6));
    }
    const rawDamage = damageRolls.reduce((a, b) => a + b, 0) + attackBonus;
    const damageDone = hit ? Math.max(0, rawDamage) : 0;
    const targetHpAfter = Math.max(0, defender.hp - damageDone);

    const roll: DiceRoll = {
      type: 'attack',
      notation: isCritical ? '2d6+' + hitBonus(attacker) : '1d6+' + hitBonus(attacker),
      dice: [attackDie, ...damageRolls],
      modifier: attackBonus,
      total: attackTotal,
      isCritical,
      isFumble,
    };

    return {
      roll,
      damageDone,
      targetHpAfter,
      targetDefeated: targetHpAfter <= 0,
    };
  }
}
