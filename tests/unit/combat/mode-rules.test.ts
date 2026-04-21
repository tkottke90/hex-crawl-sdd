import { describe, it, expect } from 'vitest';
import { ModeRules } from '../../../src/modules/combat/ModeRules';
import type { Character } from '../../../src/models/character';
import type { GameMode } from '../../../src/models/save';

function makeChar(id: string, role: Character['role'] = 'pc'): Character {
  return {
    id,
    name: `Char-${id}`,
    role,
    classId: 'fighter',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    hp: 0,
    maxHp: 12,
    attributes: { str: 12, dex: 10, con: 12, int: 10, wis: 10, cha: 10 },
    portrait: 'char-pc',
    recruitmentSource: 'starting',
    status: 'active',
    statusEffects: [],
    deathRecord: null,
    actedThisPhase: false,
  };
}

const coord = { q: 1, r: 2, s: -3 };
const turn = 5;
const casualMode: GameMode = { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: true };
const roguelikeMode: GameMode = { type: 'roguelike', allowManualSave: false, autoSaveOnCheckpoint: true };

describe('ModeRules.applyDefeat', () => {
  it('returns status: dead in Casual mode', () => {
    const char = makeChar('pc1', 'pc');
    const mode: GameMode = casualMode;
    const result = ModeRules.applyDefeat(char, mode, coord, turn);
    expect(result.status).toBe('dead');
  });

  it('returns status: dead in Roguelike mode', () => {
    const char = makeChar('pc1', 'pc');
    const mode: GameMode = roguelikeMode;
    const result = ModeRules.applyDefeat(char, mode, coord, turn);
    expect(result.status).toBe('dead');
  });

  it('sets deathRecord with coord and turn', () => {
    const char = makeChar('adv1', 'adventurer');
    const mode: GameMode = roguelikeMode;
    const result = ModeRules.applyDefeat(char, mode, coord, turn);
    expect(result.deathRecord).toEqual({ coord, turn });
  });

  it('does not mutate the original character', () => {
    const char = makeChar('pc2', 'escort');
    const mode: GameMode = casualMode;
    ModeRules.applyDefeat(char, mode, coord, turn);
    expect(char.status).toBe('active');
    expect(char.deathRecord).toBeNull();
  });
});
