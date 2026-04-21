import type { Character } from '../models/character';

/**
 * The Ward — pre-authored Escort character template.
 * `id`, `deathRecord`, `actedThisPhase`, and `recruitmentSource` are assigned at run start in T034.
 */
export const ESCORT_TEMPLATE: Omit<Character, 'id' | 'deathRecord' | 'actedThisPhase' | 'recruitmentSource'> = {
  name: 'The Ward',
  role: 'escort',
  classId: 'fighter',
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  hp: 14,
  maxHp: 14,
  attributes: { str: 12, dex: 10, con: 12, int: 10, wis: 10, cha: 10 },
  portrait: 'escort',
  status: 'active',
  statusEffects: [],
};
