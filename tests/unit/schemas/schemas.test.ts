import { describe, it, expect } from 'vitest';
import { HexCoordSchema } from '../../../src/schemas/hex.schema';
import { SaveStateSchema } from '../../../src/schemas/save.schema';
import { CharacterSchema } from '../../../src/schemas/character.schema';
import { WorldMapSchema } from '../../../src/schemas/world-map.schema';
import type { SaveState } from '../../../src/models/save';
import type { Character } from '../../../src/models/character';

// ---------------------------------------------------------------------------
// HexCoord schema
// ---------------------------------------------------------------------------
describe('HexCoordSchema', () => {
  it('accepts a valid coord where q+r+s === 0', () => {
    expect(HexCoordSchema.safeParse({ q: 1, r: -1, s: 0 }).success).toBe(true);
  });

  it('rejects a coord where q+r+s !== 0', () => {
    const result = HexCoordSchema.safeParse({ q: 1, r: 1, s: 1 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SaveState schema
// ---------------------------------------------------------------------------
describe('SaveStateSchema', () => {
  const validSave: SaveState = {
    version: 1,
    gameMode: { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: false },
    worldMap: {
      seed: 'abc',
      width: 10,
      height: 10,
      tiles: {},
      towns: [],
      enemyCamps: [],
      playerStartCoord: { q: 0, r: 0, s: 0 },
    },
    party: [],
    deathHistory: [],
    invalidated: false,
    towns: [],
    enemyCamps: [],
    activeCombat: null,
    currentLocation: { q: 0, r: 0, s: 0 },
    gold: 20,
    timestamp: new Date().toISOString(),
    metaProgression: { schemaVersion: 1 },
  };

  it('accepts a valid SaveState', () => {
    expect(SaveStateSchema.safeParse(validSave).success).toBe(true);
  });

  it('round-trips through JSON.stringify / JSON.parse', () => {
    const parsed = SaveStateSchema.safeParse(JSON.parse(JSON.stringify(validSave)));
    expect(parsed.success).toBe(true);
  });

  it('fresh state has deathHistory: [], invalidated: false, gold: 20', () => {
    const result = SaveStateSchema.safeParse(validSave);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deathHistory).toEqual([]);
      expect(result.data.invalidated).toBe(false);
      expect(result.data.gold).toBe(20);
    }
  });

  it('rejects save with missing gold field', () => {
    const { gold: _dropped, ...withoutGold } = validSave;
    expect(SaveStateSchema.safeParse(withoutGold).success).toBe(false);
  });

  it('rejects save with non-numeric gold', () => {
    expect(SaveStateSchema.safeParse({ ...validSave, gold: 'twenty' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Character schema
// ---------------------------------------------------------------------------
describe('CharacterSchema', () => {
  const baseChar: Character = {
    id: 'c1',
    name: 'Hero',
    role: 'pc',
    classId: 'fighter',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    hp: 10,
    maxHp: 10,
    attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    portrait: 'hero',
    recruitmentSource: 'starting',
    status: 'active',
    statusEffects: [],
    deathRecord: null,
    actedThisPhase: false,
  };

  it('accepts role "pc"', () => {
    expect(CharacterSchema.safeParse(baseChar).success).toBe(true);
  });

  it('accepts role "escort"', () => {
    expect(CharacterSchema.safeParse({ ...baseChar, role: 'escort' }).success).toBe(true);
  });

  it('accepts role "adventurer"', () => {
    expect(CharacterSchema.safeParse({ ...baseChar, role: 'adventurer' }).success).toBe(true);
  });

  it('rejects an unknown role', () => {
    expect(CharacterSchema.safeParse({ ...baseChar, role: 'villain' }).success).toBe(false);
  });

  it('accepts deathRecord: null', () => {
    expect(CharacterSchema.safeParse({ ...baseChar, deathRecord: null }).success).toBe(true);
  });

  it('accepts a valid deathRecord', () => {
    const withDeath: Character = {
      ...baseChar,
      status: 'dead',
      deathRecord: { coord: { q: 1, r: -1, s: 0 }, turn: 5 },
    };
    expect(CharacterSchema.safeParse(withDeath).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// WorldMap schema
// ---------------------------------------------------------------------------
describe('WorldMapSchema', () => {
  it('accepts a minimal valid WorldMap', () => {
    const wm = {
      seed: 'test',
      width: 5,
      height: 5,
      tiles: {},
      towns: [],
      enemyCamps: [],
      playerStartCoord: { q: 0, r: 0, s: 0 },
    };
    expect(WorldMapSchema.safeParse(wm).success).toBe(true);
  });
});
