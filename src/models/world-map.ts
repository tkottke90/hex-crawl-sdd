import type { HexCoord, HexTile } from './hex';

export type TownId = string;
export type EnemyCampId = string;

export interface DeathMarker {
  coord: HexCoord;
  name: string;
}

export interface WorldMap {
  seed: string;
  width: number;
  height: number;
  tiles: Record<string, HexTile>;
  towns: TownId[];
  enemyCamps: EnemyCampId[];
  playerStartCoord: HexCoord;
  remainingTurnBudget?: number;
}
