import type { SaveState } from '../../models/save';
import type { WorldMap } from '../../models/world-map';
import type { Character, DeathRecord } from '../../models/character';
import type { HexCoord } from '../../models/hex';
import type { Town } from '../../models/town';
import type { EnemyCamp } from '../../models/enemy';
import type { CombatEncounter } from '../../models/combat';
import type { GameMode } from '../../models/save';
import type { MetaProgressionModule } from '../../models/meta-progression';

export const CURRENT_SCHEMA_VERSION = 1;

export interface GameStateInput {
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
  metaProgression: MetaProgressionModule;
}

/**
 * Assemble a SaveState from live game state.
 * Stamps version and timestamp. Pure — no side effects.
 */
export function serialise(input: GameStateInput): SaveState {
  return {
    version: CURRENT_SCHEMA_VERSION,
    gameMode: input.gameMode,
    worldMap: input.worldMap,
    party: input.party,
    deathHistory: input.deathHistory,
    invalidated: input.invalidated,
    towns: input.towns,
    enemyCamps: input.enemyCamps,
    activeCombat: input.activeCombat,
    currentLocation: input.currentLocation,
    gold: input.gold,
    timestamp: new Date().toISOString(),
    metaProgression: input.metaProgression,
  };
}
