import { describe, it, expect } from 'vitest';
import { makeCoord } from '../../../src/modules/hex-grid/HexCoordUtils';
import { planPartyMove } from '../../../src/modules/world-map/PartyMovementPlanner';
import type { WorldMap } from '../../../src/models/world-map';
import type { HexTile } from '../../../src/models/hex';

function tile(q: number, r: number, passable = true, moveCost = 1): HexTile {
  const s = -q - r;
  return {
    coord: { q, r, s },
    terrain: 'grassland',
    passable,
    moveCost,
    poiTag: 'empty',
    occupants: [],
    fogOfWar: false,
    explored: true,
  };
}

function makeMap(tiles: HexTile[]): WorldMap {
  const byKey: Record<string, HexTile> = {};
  for (const current of tiles) {
    byKey[`${current.coord.q},${current.coord.r},${current.coord.s}`] = current;
  }
  return {
    seed: 'test',
    width: 10,
    height: 10,
    tiles: byKey,
    towns: [],
    enemyCamps: [],
    playerStartCoord: makeCoord(0, 0),
  };
}

describe('PartyMovementPlanner', () => {
  it('returns a full path when budget is sufficient', () => {
    const map = makeMap([tile(0, 0), tile(1, -1), tile(2, -2)]);
    const plan = planPartyMove(makeCoord(0, 0), makeCoord(2, -2), 5, map);

    expect(plan.reachable).toBe(true);
    expect(plan.traversed).toBe(2);
    expect(plan.destination).toEqual(makeCoord(2, -2));
  });

  it('truncates the path when the remaining budget is short', () => {
    const map = makeMap([tile(0, 0), tile(1, -1), tile(2, -2)]);
    const plan = planPartyMove(makeCoord(0, 0), makeCoord(2, -2), 1, map);

    expect(plan.reachable).toBe(true);
    expect(plan.truncated).toBe(true);
    expect(plan.traversed).toBe(1);
    expect(plan.destination).toEqual(makeCoord(1, -1));
  });

  it('returns an empty plan when no path exists', () => {
    const map = makeMap([tile(0, 0), tile(1, -1, false), tile(2, -2)]);
    const plan = planPartyMove(makeCoord(0, 0), makeCoord(2, -2), 5, map);

    expect(plan.reachable).toBe(false);
    expect(plan.destination).toBeNull();
    expect(plan.traversed).toBe(0);
  });
});
