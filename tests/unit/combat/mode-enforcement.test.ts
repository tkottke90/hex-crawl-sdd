import { describe, it, expect } from 'vitest';
import { checkRunEnd } from '../../../src/modules/combat/RunEndDetector';
import type { Character } from '../../../src/models/character';

function makeCharacter(overrides: Partial<Character>): Character {
  return {
    id: 'char-1',
    name: 'Test',
    role: 'adventurer',
    classId: 'fighter',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    hp: 10,
    maxHp: 10,
    attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    portrait: 'char-1',
    recruitmentSource: 'starting',
    status: 'active',
    statusEffects: [],
    deathRecord: null,
    actedThisPhase: false,
    ...overrides,
  };
}

describe('checkRunEnd', () => {
  it('returns false when all party members are active', () => {
    const party = [
      makeCharacter({ role: 'pc' }),
      makeCharacter({ id: 'escort', role: 'escort' }),
      makeCharacter({ id: 'adv', role: 'adventurer' }),
    ];
    expect(checkRunEnd(party)).toBe(false);
  });

  it('returns true when PC dies in Casual mode context', () => {
    const party = [
      makeCharacter({ role: 'pc', status: 'dead' }),
      makeCharacter({ id: 'escort', role: 'escort' }),
    ];
    expect(checkRunEnd(party)).toBe(true);
  });

  it('returns true when Escort dies in Casual mode context', () => {
    const party = [
      makeCharacter({ role: 'pc' }),
      makeCharacter({ id: 'escort', role: 'escort', status: 'dead' }),
    ];
    expect(checkRunEnd(party)).toBe(true);
  });

  it('returns false when only Adventurer dies', () => {
    const party = [
      makeCharacter({ role: 'pc' }),
      makeCharacter({ id: 'escort', role: 'escort' }),
      makeCharacter({ id: 'adv', role: 'adventurer', status: 'dead' }),
    ];
    expect(checkRunEnd(party)).toBe(false);
  });

  it('returns true when PC dies in Roguelike mode context (same function)', () => {
    const party = [
      makeCharacter({ role: 'pc', status: 'dead' }),
    ];
    expect(checkRunEnd(party)).toBe(true);
  });

  it('returns false when only Adventurer dies in Roguelike context', () => {
    const party = [
      makeCharacter({ role: 'pc' }),
      makeCharacter({ id: 'adv', role: 'adventurer', status: 'dead' }),
    ];
    expect(checkRunEnd(party)).toBe(false);
  });
});
