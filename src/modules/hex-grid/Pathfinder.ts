import type { HexCoord } from '../../models/hex';
import type { WorldMap } from '../../models/world-map';
import { neighbors, distance } from './HexCoordUtils';

interface HeapNode {
  coord: HexCoord;
  f: number;
}

function key(c: HexCoord): string {
  return `${c.q},${c.r},${c.s}`;
}

/**
 * A* pathfinding on a hex grid.
 * Returns the path from `start` (exclusive) to `end` (inclusive), or null if unreachable.
 */
export function findPath(
  start: HexCoord,
  end: HexCoord,
  map: WorldMap,
): HexCoord[] | null {
  const endKey = key(end);
  const endTile = map.tiles[endKey];
  if (!endTile || !endTile.passable) return null;

  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, HexCoord>();
  const open: HeapNode[] = [];

  const startKey = key(start);
  gScore.set(startKey, 0);
  open.push({ coord: start, f: distance(start, end) });

  while (open.length > 0) {
    // Pop the node with the lowest f score (simple linear scan — good enough for small maps)
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const currentKey = key(current.coord);

    if (currentKey === endKey) {
      return reconstructPath(cameFrom, current.coord);
    }

    for (const neighbor of neighbors(current.coord)) {
      const nKey = key(neighbor);
      const tile = map.tiles[nKey];
      if (!tile || !tile.passable) continue;

      const tentativeG = (gScore.get(currentKey) ?? Infinity) + tile.moveCost;
      if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
        cameFrom.set(nKey, current.coord);
        gScore.set(nKey, tentativeG);
        open.push({ coord: neighbor, f: tentativeG + distance(neighbor, end) });
      }
    }
  }

  return null;
}

function reconstructPath(cameFrom: Map<string, HexCoord>, current: HexCoord): HexCoord[] {
  const path: HexCoord[] = [current];
  let cur = current;
  while (cameFrom.has(key(cur))) {
    cur = cameFrom.get(key(cur))!;
    path.unshift(cur);
  }
  // Remove start from path
  path.shift();
  return path;
}
