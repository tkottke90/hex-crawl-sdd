import { describe, it, expect } from 'vitest';
import { getHirePool, hireCharacter } from '../../../src/modules/recruitment/TownService';
import type { Town, HireableHero } from '../../../src/models/town';
import type { HexCoord } from '../../../src/models/hex';
import type { Character } from '../../../src/models/character';

const coord: HexCoord = { q: 0, r: 0, s: 0 };

function makeHero(overrides: Partial<HireableHero> = {}): HireableHero {
  return {
    characterTemplate: {
      name: 'Hired Hero',
      role: 'adventurer',
      classId: 'fighter',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      hp: 10,
      maxHp: 10,
      attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      portrait: 'char-pc',
      status: 'active',
      statusEffects: [],
    },
    hireCost: 20,
    ...overrides,
  };
}

function makeParty(count: number): Character[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `char-${i}`,
    name: `Char ${i}`,
    role: 'adventurer' as const,
    classId: 'fighter',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    hp: 10,
    maxHp: 10,
    attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    portrait: 'char-pc',
    recruitmentSource: 'starting' as const,
    status: 'active' as const,
    statusEffects: [],
    deathRecord: null,
    actedThisPhase: false,
  }));
}

describe('getHirePool', () => {
  it('returns hirePool from town', () => {
    const hero = makeHero();
    const town: Town = { id: 't1', name: 'Riverbend', coord, hirePool: [hero] };
    expect(getHirePool(town)).toEqual([hero]);
  });

  it('returns empty array when no hire pool', () => {
    const town: Town = { id: 't2', name: 'Empty Town', coord, hirePool: [] };
    expect(getHirePool(town)).toEqual([]);
  });
});

describe('hireCharacter', () => {
  it('deducts hireCost and returns character when gold sufficient and party has room', () => {
    const hero = makeHero({ hireCost: 20 });
    const party = makeParty(2);
    const result = hireCharacter(hero, party, 25);
    expect('character' in result).toBe(true);
    if ('character' in result) {
      expect(result.goldAfter).toBe(5); // 25 - 20
      expect(result.character.role).toBe('adventurer');
      expect(result.character.recruitmentSource).toBe('hired');
    }
  });

  it('deduction equals hero.hireCost, not a hardcoded amount', () => {
    const hero = makeHero({ hireCost: 15 });
    const party = makeParty(1);
    const result = hireCharacter(hero, party, 30);
    expect('character' in result).toBe(true);
    if ('character' in result) {
      expect(result.goldAfter).toBe(15); // 30 - 15
    }
  });

  it('returns { error: party-full } when party is at cap', () => {
    const hero = makeHero();
    const fullParty = makeParty(8);
    const result = hireCharacter(hero, fullParty, 20);
    expect(result).toEqual({ error: 'party-full' });
  });

  it('returns { error: insufficient-gold } when gold < hireCost', () => {
    const hero = makeHero({ hireCost: 20 });
    const party = makeParty(1);
    const result = hireCharacter(hero, party, 0);
    expect(result).toEqual({ error: 'insufficient-gold' });
  });

  it('assigns unique id to hired character', () => {
    const hero = makeHero();
    const party = makeParty(1);
    const r1 = hireCharacter(hero, party, 50);
    const r2 = hireCharacter(hero, party, 50);
    expect('character' in r1 && 'character' in r2).toBe(true);
    if ('character' in r1 && 'character' in r2) {
      expect(r1.character.id).not.toBe(r2.character.id);
    }
  });
});
