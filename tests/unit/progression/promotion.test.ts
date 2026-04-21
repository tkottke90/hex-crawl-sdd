import { describe, it, expect } from 'vitest';
import { getPromotionOptions, applyPromotion } from '../../../src/modules/progression/ProgressionService';
import type { Character } from '../../../src/models/character';
import type { ClassDefinition } from '../../../src/models/class';

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: 'c1',
    name: 'Hero',
    role: 'pc',
    classId: 'fighter',
    level: 10,
    xp: 0,
    xpToNextLevel: 1000,
    hp: 30,
    maxHp: 30,
    attributes: { str: 16, dex: 10, con: 14, int: 8, wis: 8, cha: 8 },
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
  growthRates: { str: 0.65, dex: 0.40, con: 0.55, int: 0.20, wis: 0.20, cha: 0.20 },
  maxHpBase: 12,
  maxHpGrowth: 0.3,
  promotionLevel: 10,
  promotionPaths: ['hero', 'general'],
  moveRange: 4,
};

const heroDef: ClassDefinition = {
  id: 'hero',
  name: 'Hero',
  tier: 'promoted',
  baseStats: { str: 18, dex: 12, con: 16, int: 8, wis: 8, cha: 8 },
  growthRates: { str: 0.80, dex: 0.45, con: 0.55, int: 0.10, wis: 0.10, cha: 0.10 },
  maxHpBase: 16,
  maxHpGrowth: 0.4,
  promotionLevel: null,
  promotionPaths: [],
  moveRange: 5,
};

const generalDef: ClassDefinition = {
  id: 'general',
  name: 'General',
  tier: 'promoted',
  baseStats: { str: 20, dex: 8, con: 18, int: 8, wis: 8, cha: 8 },
  growthRates: { str: 0.60, dex: 0.30, con: 0.65, int: 0.15, wis: 0.15, cha: 0.15 },
  maxHpBase: 18,
  maxHpGrowth: 0.5,
  promotionLevel: null,
  promotionPaths: [],
  moveRange: 4,
};

const allDefs = [fighterDef, heroDef, generalDef];

describe('getPromotionOptions', () => {
  it('returns promotion options when at promotionLevel', () => {
    const char = makeChar({ level: 10, classId: 'fighter' });
    const options = getPromotionOptions(char, fighterDef, allDefs);
    expect(options.map((c) => c.id)).toContain('hero');
    expect(options.map((c) => c.id)).toContain('general');
  });

  it('returns empty array when below promotionLevel', () => {
    const char = makeChar({ level: 5 });
    const options = getPromotionOptions(char, fighterDef, allDefs);
    expect(options).toHaveLength(0);
  });

  it('returns empty array for promoted class with no promotionPaths', () => {
    const char = makeChar({ level: 20, classId: 'hero' });
    const options = getPromotionOptions(char, heroDef, allDefs);
    expect(options).toHaveLength(0);
  });
});

describe('applyPromotion', () => {
  it('swaps classId and resets level to 1', () => {
    const char = makeChar({ level: 10 });
    const result = applyPromotion(char, heroDef);
    expect(result.classId).toBe('hero');
    expect(result.level).toBe(1);
    expect(result.xp).toBe(0);
  });

  it('applies promoted class base stats as additive bonuses', () => {
    const char = makeChar({ attributes: { str: 16, dex: 10, con: 14, int: 8, wis: 8, cha: 8 } });
    const result = applyPromotion(char, heroDef);
    // heroDef.baseStats.str = 18 — additive: 16 + 18 = 34? No: "applies baseStats as additive bonuses"
    // means: char.attributes.str + heroDef.baseStats.str
    expect(result.attributes.str).toBe(char.attributes.str + heroDef.baseStats.str);
  });

  it('recalculates maxHp and fully heals on promotion', () => {
    const char = makeChar({ hp: 10, maxHp: 30 });
    const result = applyPromotion(char, heroDef);
    // maxHp = heroDef.maxHpBase + floor((con-10)/2)
    expect(result.hp).toBe(result.maxHp);
    expect(result.maxHp).toBeGreaterThan(0);
  });

  it('does not mutate input character', () => {
    const char = makeChar();
    applyPromotion(char, heroDef);
    expect(char.classId).toBe('fighter');
  });
});
