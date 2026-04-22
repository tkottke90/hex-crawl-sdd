import type { HexCoord } from '../../models/hex';
import type { WorldMap } from '../../models/world-map';
import { findPath } from '../hex-grid/Pathfinder';

export interface PartyMovePlan {
  path: HexCoord[];
  destination: HexCoord | null;
  traversed: number;
  reachable: boolean;
  truncated: boolean;
}

export function planPartyMove(
  start: HexCoord,
  destination: HexCoord,
  remainingBudget: number,
  map: WorldMap,
): PartyMovePlan {
  const path = findPath(start, destination, map) ?? [];
  if (path.length === 0 || remainingBudget <= 0) {
    return { path: [], destination: null, traversed: 0, reachable: false, truncated: false };
  }

  const traversed = Math.min(path.length, remainingBudget);
  const plannedPath = path.slice(0, traversed);
  const destinationCoord = plannedPath.at(-1) ?? null;

  return {
    path: plannedPath,
    destination: destinationCoord,
    traversed,
    reachable: plannedPath.length > 0,
    truncated: traversed < path.length,
  };
}
