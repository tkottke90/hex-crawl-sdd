import { describe, it, expect } from 'vitest';
import { killReward, campClearBonus } from '../../../src/modules/combat/GoldRewardCalculator';
import { PRNG } from '../../../src/utils/prng';
import type { EnemyUnit } from '../../../src/models/enemy';

function makeEnemy(overrides: Partial<EnemyUnit> = {}): EnemyUnit {
  return {
    id: 'enemy-1',
    name: 'Goblin',
    classId: 'squire',
    tier: 1,
    level: 2,
    hp: 8,
    maxHp: 8,
    attributes: { str: 8, dex: 10, con: 8, int: 6, wis: 6, cha: 4 },
    portrait: 'char-pc',
    statusEffects: [],
    moveRange: 3,
    status: 'active',
    ...overrides,
  };
}

describe('killReward', () => {
  it('returns deterministic value for a fixed seed', () => {
    const enemy = makeEnemy({ level: 2, tier: 1 });
    const result1 = killReward(enemy, new PRNG('test-gold-seed'));
    const result2 = killReward(enemy, new PRNG('test-gold-seed'));
    expect(result1).toBe(result2);
  });

  it('matches Math.floor(level * tier * (1 + prng.next()))', () => {
    const seed = 'deterministic';
    const enemy = makeEnemy({ level: 3, tier: 2 });
    const prng1 = new PRNG(seed);
    const expected = Math.floor(enemy.level * enemy.tier * (1 + prng1.next()));
    const prng2 = new PRNG(seed);
    expect(killReward(enemy, prng2)).toBe(expected);
  });

  it('Tier 3 enemy gives higher reward than Tier 1 for same level', () => {
    const prng1 = new PRNG('same-seed');
    const prng2 = new PRNG('same-seed');
    const t1 = makeEnemy({ level: 2, tier: 1 });
    const t3 = makeEnemy({ level: 2, tier: 3 });
    expect(killReward(t3, prng1)).toBeGreaterThan(killReward(t1, prng2));
  });

  it('returns an integer', () => {
    const enemy = makeEnemy({ level: 2, tier: 2 });
    const result = killReward(enemy, new PRNG('int-test'));
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('campClearBonus', () => {
  it('returns Math.floor(avgLevel * 5)', () => {
    const enemies = [makeEnemy({ level: 2 }), makeEnemy({ level: 4 })];
    const avgLevel = (2 + 4) / 2; // 3
    expect(campClearBonus(enemies)).toBe(Math.floor(avgLevel * 5));
  });

  it('returns 0 for empty enemy array', () => {
    expect(campClearBonus([])).toBe(0);
  });

  it('returns integer', () => {
    const enemies = [makeEnemy({ level: 3 }), makeEnemy({ level: 4 })];
    expect(Number.isInteger(campClearBonus(enemies))).toBe(true);
  });
});
