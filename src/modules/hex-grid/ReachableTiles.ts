import type { HexCoord } from '../../models/hex';
import type { HexTile } from '../../models/hex';
import type { WorldMap } from '../../models/world-map';
import { neighbors } from './HexCoordUtils';

function key(c: HexCoord): string {
  return `${c.q},${c.r},${c.s}`;
}

/**
 * BFS flood-fill returning all tiles reachable within `movePoints`.
 * The origin tile is excluded from the result.
 */
export function reachableTiles(
  origin: HexCoord,
  movePoints: number,
  map: WorldMap,
): HexTile[] {
  const visited = new Map<string, number>(); // key -> remaining points on arrival
  const result: HexTile[] = [];
  const queue: Array<{ coord: HexCoord; remaining: number }> = [
    { coord: origin, remaining: movePoints },
  ];
  visited.set(key(origin), movePoints);

  while (queue.length > 0) {
    const { coord, remaining } = queue.shift()!;
    for (const neighbor of neighbors(coord)) {
      const nKey = key(neighbor);
      const tile = map.tiles[nKey];
      if (!tile || !tile.passable) continue;

      const afterEnter = remaining - tile.moveCost;
      if (afterEnter < 0) continue;

      const prev = visited.get(nKey);
      if (prev === undefined || afterEnter > prev) {
        visited.set(nKey, afterEnter);
        result.push(tile);
        queue.push({ coord: neighbor, remaining: afterEnter });
      }
    }
  }

  return result;
}
