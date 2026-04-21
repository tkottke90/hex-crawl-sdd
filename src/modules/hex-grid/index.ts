import type { WorldMap } from '../../models/world-map';
import type { HexCoord, HexTile } from '../../models/hex';
import { HexGridStore } from './HexGridStore';
import { findPath } from './Pathfinder';
import { reachableTiles } from './ReachableTiles';
import { makeCoord, neighbors, distance, toPixel, fromPixel } from './HexCoordUtils';

export interface HexGridModule {
  store: HexGridStore;
  makeCoord: typeof makeCoord;
  neighbors: typeof neighbors;
  distance: typeof distance;
  toPixel: typeof toPixel;
  fromPixel: typeof fromPixel;
  findPath: (start: HexCoord, end: HexCoord) => HexCoord[] | null;
  reachableTiles: (origin: HexCoord, movePoints: number) => HexTile[];
}

export function createHexGridModule(map: WorldMap): HexGridModule {
  const store = new HexGridStore(map);

  return {
    store,
    makeCoord,
    neighbors,
    distance,
    toPixel,
    fromPixel,
    findPath: (start, end) => findPath(start, end, store.getMap() as WorldMap),
    reachableTiles: (origin, movePoints) =>
      reachableTiles(origin, movePoints, store.getMap() as WorldMap),
  };
}

export { generateMap } from './MapGenerator';
export { makeCoord, neighbors, distance, toPixel, fromPixel } from './HexCoordUtils';
export { findPath } from './Pathfinder';
export { reachableTiles } from './ReachableTiles';
