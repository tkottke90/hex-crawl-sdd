import type { Character, DeathRecord } from './character';
import type { WorldMap } from './world-map';
import type { Town } from './town';
import type { EnemyCamp } from './enemy';
import type { CombatEncounter } from './combat';
import type { HexCoord } from './hex';
import type { MetaProgressionModule } from './meta-progression';

export type GameModeType = 'casual' | 'roguelike';

export interface GameMode {
  type: GameModeType;
  allowManualSave: boolean;
  autoSaveOnCheckpoint: boolean;
}

export interface SaveState {
  version: number;
  gameMode: GameMode;
  worldMap: WorldMap;
  party: Character[];
  deathHistory: DeathRecord[];
  invalidated: boolean;
  towns: Town[];
  enemyCamps: EnemyCamp[];
  activeCombat: CombatEncounter | null;
  currentLocation: HexCoord;
  gold: number;
  timestamp: string;
  metaProgression: MetaProgressionModule;
}
