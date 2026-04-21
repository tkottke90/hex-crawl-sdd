import type { Attributes } from './attributes';
import type { StatusEffect } from './status-effect';

export type EnemyStatus = 'active' | 'dead';

export interface EnemyUnit {
  id: string;
  name: string;
  classId: string;
  tier: 1 | 2 | 3;
  level: number;
  hp: number;
  maxHp: number;
  attributes: Attributes;
  portrait: string;
  moveRange: number;
  status: EnemyStatus;
  statusEffects: StatusEffect[];
}

export interface EnemyCamp {
  id: string;
  coord: import('./hex').HexCoord;
  enemies: EnemyUnit[];
  defeated: boolean;
}
