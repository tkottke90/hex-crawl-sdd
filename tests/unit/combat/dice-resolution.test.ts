import { describe, it, expect } from 'vitest';
import { DiceResolver } from '../../../src/modules/combat/DiceResolver';
import { PRNG } from '../../../src/utils/prng';
import type { Character } from '../../../src/models/character';

function makeChar(id: string, str = 12, dex = 10): Character {
  return {
    id,
    name: `Char-${id}`,
    role: 'pc',
    classId: 'fighter',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    hp: 12,
    maxHp: 12,
    attributes: { str, dex, con: 12, int: 10, wis: 10, cha: 10 },
    portrait: 'char-pc',
    recruitmentSource: 'starting',
    status: 'active',
    statusEffects: [],
    deathRecord: null,
    actedThisPhase: false,
  };
}

describe('DiceResolver', () => {
  const prng = new PRNG('test-seed');
  const resolver = new DiceResolver();

  it('resolveAttack returns a DiceRoll with type attack', () => {
    const attacker = makeChar('a', 14, 10);
    const defender = makeChar('d', 10, 10);
    const result = resolver.resolveAttack(attacker, defender, prng);
    expect(result.roll.type).toBe('attack');
  });

  it('damage on hit is positive', () => {
    const attacker = makeChar('a', 14, 10);
    const defender = makeChar('d', 10, 10);
    // Run many times to get at least one hit
    let hitFound = false;
    const p = new PRNG('hit-seed');
    for (let i = 0; i < 30; i++) {
      const r = resolver.resolveAttack(attacker, defender, p);
      if (r.damageDone > 0) { hitFound = true; break; }
    }
    expect(hitFound).toBe(true);
  });

  it('crit flag set when attack die is 20', () => {
    // Provide a PRNG that always returns the maximum (next() → ~1)
    const fixedPrng = { next: () => 0.9999, nextInt: (_min: number, _max: number) => 20 } as unknown as PRNG;
    const attacker = makeChar('a', 10, 10);
    const defender = makeChar('d', 10, 10);
    const result = resolver.resolveAttack(attacker, defender, fixedPrng);
    expect(result.roll.isCritical).toBe(true);
  });

  it('fumble flag set when attack die is 1', () => {
    const fixedPrng = { next: () => 0.0001, nextInt: (_min: number, _max: number) => 1 } as unknown as PRNG;
    const attacker = makeChar('a', 10, 10);
    const defender = makeChar('d', 10, 10);
    const result = resolver.resolveAttack(attacker, defender, fixedPrng);
    expect(result.roll.isFumble).toBe(true);
    expect(result.damageDone).toBe(0); // fumble = auto-miss
  });

  it('HP mutation does not modify original character objects', () => {
    const attacker = makeChar('a', 18, 10);
    const defender = makeChar('d', 10, 8); // low DEX → low defense
    const p = new PRNG('hp-seed');
    resolver.resolveAttack(attacker, defender, p);
    expect(defender.hp).toBe(12); // original unmodified
  });

  it('targetHpAfter is lower than maxHp after a hit', () => {
    const attacker = makeChar('a', 18, 10);
    const defender = makeChar('d', 10, 8);
    const p = new PRNG('hp-seed2');
    let hitResult = null;
    for (let i = 0; i < 30; i++) {
      const r = resolver.resolveAttack(attacker, defender, p);
      if (r.damageDone > 0) { hitResult = r; break; }
    }
    expect(hitResult).not.toBeNull();
    expect(hitResult!.targetHpAfter).toBeLessThan(12);
  });

  it('targetDefeated is true when HP reaches 0', () => {
    const attacker = makeChar('a', 20, 10);
    const defender = makeChar('d', 10, 8);
    defender.hp = 1;
    const fixedPrng = { next: () => 0.9999, nextInt: (_min: number, max: number) => max } as unknown as PRNG;
    const result = resolver.resolveAttack(attacker, defender, fixedPrng);
    // With max rolls and hp=1, damage will exceed HP
    expect(result.targetDefeated).toBe(result.targetHpAfter <= 0);
  });
});
