import type { SaveState } from '../../models/save';
import type { DeathMarker, WorldMap } from '../../models/world-map';
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
  deathMarkers?: DeathMarker[];
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
  const deathMarkers = input.deathMarkers ?? input.party
    .filter((character) => character.status === 'dead' && character.deathRecord != null)
    .map((character) => ({ coord: character.deathRecord!.coord, name: character.name }));
  const worldMap = {
    ...input.worldMap,
    remainingTurnBudget: input.worldMap.remainingTurnBudget ?? 0,
  };

  return {
    version: CURRENT_SCHEMA_VERSION,
    gameMode: input.gameMode,
    worldMap,
    party: input.party,
    deathMarkers,
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
