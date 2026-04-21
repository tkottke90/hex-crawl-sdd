import { describe, it, expect } from 'vitest';
import { awardXp, applyLevelUp } from '../../../src/modules/progression/ProgressionService';
import { PRNG } from '../../../src/utils/prng';
import type { Character } from '../../../src/models/character';
import type { ClassDefinition } from '../../../src/models/class';

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: 'c1',
    name: 'Hero',
    role: 'pc',
    classId: 'fighter',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    hp: 12,
    maxHp: 12,
    attributes: { str: 14, dex: 10, con: 12, int: 8, wis: 8, cha: 8 },
    portrait: 'char-pc',
    recruitmentSource: 'starting',
    status: 'active',
    statusEffects: [],
    deathRecord: null,
    actedThisPhase: false,
    ...overrides,
  };
}

const fighterDef: ClassDefinition = {
  id: 'fighter',
  name: 'Fighter',
  tier: 'base',
  baseStats: { str: 14, dex: 10, con: 12, int: 8, wis: 8, cha: 8 },
  growthRates: { str: 1.0, dex: 0.0, con: 1.0, int: 0.0, wis: 0.0, cha: 0.0 },
  maxHpBase: 12,
  maxHpGrowth: 0.3,
  promotionLevel: 10,
  promotionPaths: ['hero', 'general'],
  moveRange: 4,
};

describe('awardXp', () => {
  it('accumulates XP without levelling up', () => {
    const char = makeChar({ xp: 0, xpToNextLevel: 100, level: 1 });
    const result = awardXp(char, 50);
    expect(result.xp).toBe(50);
    expect(result.level).toBe(1);
  });

  it('levels up when XP reaches threshold', () => {
    const char = makeChar({ xp: 90, xpToNextLevel: 100, level: 1 });
    const result = awardXp(char, 20);
    expect(result.level).toBe(2);
    expect(result.xp).toBe(10); // overflow carried
  });

  it('sets xpToNextLevel to level * 100 after level-up', () => {
    const char = makeChar({ xp: 80, xpToNextLevel: 100, level: 1 });
    const result = awardXp(char, 30);
    expect(result.xpToNextLevel).toBe(200); // level 2 * 100
  });

  it('does not mutate input character', () => {
    const char = makeChar({ xp: 0, xpToNextLevel: 100, level: 1 });
    awardXp(char, 50);
    expect(char.xp).toBe(0);
  });
});

describe('applyLevelUp', () => {
  it('increments level', () => {
    const prng = new PRNG('test-seed');
    const char = makeChar({ level: 1 });
    const result = applyLevelUp(char, fighterDef, prng);
    expect(result.level).toBe(2);
  });

  it('applies growth rates using prng (100% str growth always fires)', () => {
    const prng = new PRNG('test-seed');
    const char = makeChar({ level: 1, attributes: { str: 14, dex: 10, con: 12, int: 8, wis: 8, cha: 8 } });
    const result = applyLevelUp(char, fighterDef, prng);
    // str 100% growth → always +1; dex 0% → never +1
    expect(result.attributes.str).toBe(15);
    expect(result.attributes.dex).toBe(10);
  });

  it('recalculates maxHp after level-up', () => {
    const prng = new PRNG('test-seed');
    const char = makeChar({ level: 1, maxHp: 12 });
    const result = applyLevelUp(char, fighterDef, prng);
    // con 100% growth → con was 12, becomes 13 → conMod = +1; maxHp = maxHpBase(12) + conMod(1) * newLevel(2)
    expect(result.maxHp).toBeGreaterThan(char.maxHp);
  });

  it('does not mutate input character', () => {
    const prng = new PRNG('test-seed');
    const char = makeChar({ level: 1 });
    applyLevelUp(char, fighterDef, prng);
    expect(char.level).toBe(1);
  });
});
