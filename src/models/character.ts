import type { Attributes } from './attributes';
import type { HexCoord } from './hex';
import type { StatusEffect } from './status-effect';

export type CharacterRole = 'pc' | 'escort' | 'adventurer';
export type CharacterStatus = 'active' | 'dead';
export type RecruitmentSource = 'starting' | 'hired' | 'encountered';

export interface DeathRecord {
  coord: HexCoord;
  turn: number;
}

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  classId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  hp: number;
  maxHp: number;
  attributes: Attributes;
  portrait: string;
  recruitmentSource: RecruitmentSource;
  status: CharacterStatus;
  statusEffects: StatusEffect[];
  deathRecord: DeathRecord | null;
  actedThisPhase: boolean;
}
