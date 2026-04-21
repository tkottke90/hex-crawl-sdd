import type { HexCoord } from './hex';

export type CombatPhase = 'player' | 'enemy' | 'resolution';
export type DiceRollType = 'attack' | 'damage' | 'saving-throw' | 'initiative';

export interface DiceRoll {
  type: DiceRollType;
  notation: string;
  dice: number[];
  modifier: number;
  total: number;
  isCritical: boolean;
  isFumble: boolean;
}

export interface CombatLogEntry {
  round: number;
  phase: CombatPhase;
  actorId: string;
  action: 'move' | 'attack' | 'wait' | 'use-item';
  roll: DiceRoll | null;
  targetId: string | null;
  hpDelta: number | null;
  narrative: string;
}

export interface CombatResolution {
  outcome: 'player-victory' | 'player-defeat' | 'retreat';
  survivingFriendlyNpcIds: string[];
  recruitmentOffered: boolean;
}

export interface CombatEncounter {
  id: string;
  phase: CombatPhase;
  round: number;
  playerUnits: string[];
  enemyUnits: string[];
  friendlyNpcs: string[];
  combatLog: CombatLogEntry[];
  resolution: CombatResolution | null;
}

export type { HexCoord };
