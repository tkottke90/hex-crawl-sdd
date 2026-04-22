import { describe, it, expect } from 'vitest';
import { makeCoord } from '../../../src/modules/hex-grid/HexCoordUtils';
import { findPath } from '../../../src/modules/hex-grid/Pathfinder';
import { reachableTiles } from '../../../src/modules/hex-grid/ReachableTiles';
import type { WorldMap } from '../../../src/models/world-map';
import type { HexTile } from '../../../src/models/hex';

function makeMap(tiles: HexTile[]): WorldMap {
  const tileMap: Record<string, HexTile> = {};
  for (const t of tiles) {
    tileMap[`${t.coord.q},${t.coord.r},${t.coord.s}`] = t;
  }
  return {
    seed: 'test',
    width: 10,
    height: 10,
    tiles: tileMap,
    towns: [],
    enemyCamps: [],
    playerStartCoord: makeCoord(0, 0),
  };
}

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

describe('Pathfinder', () => {
  it('finds a direct path between adjacent tiles', () => {
    const map = makeMap([tile(0, 0), tile(1, -1), tile(2, -2)]);
    const path = findPath(makeCoord(0, 0), makeCoord(1, -1), map);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });

  it('returns an empty path when the start and destination are the same tile', () => {
    const map = makeMap([tile(0, 0)]);
    const path = findPath(makeCoord(0, 0), makeCoord(0, 0), map);
    expect(path).toEqual([]);
  });

  it('returns null when destination is impassable', () => {
    const map = makeMap([tile(0, 0), tile(1, -1, false)]);
    const path = findPath(makeCoord(0, 0), makeCoord(1, -1), map);
    expect(path).toBeNull();
  });

  it('finds shortest path around an obstacle', () => {
    // Straight: (0,0) -> (1,-1) -> (2,-2)  blocked at (1,-1)
    // Alternative: (0,0) -> (0,-1) -> (1,-2) -> (2,-2)
    const map = makeMap([
      tile(0, 0),
      tile(1, -1, false), // blocked
      tile(0, -1),
      tile(1, -2),
      tile(2, -2),
    ]);
    const path = findPath(makeCoord(0, 0), makeCoord(2, -2), map);
    expect(path).not.toBeNull();
    // Path should not include the blocked tile
    const passedThroughBlocked = path!.some((c) => c.q === 1 && c.r === -1);
    expect(passedThroughBlocked).toBe(false);
  });

  it('returns null when there is no path', () => {
    // Island — start is surrounded by impassable
    const map = makeMap([
      tile(0, 0),
      tile(1, -1, false),
      tile(0, -1, false),
      tile(-1, 0, false),
      tile(-1, 1, false),
      tile(0, 1, false),
      tile(1, 0, false),
      tile(3, -3), // unreachable island
    ]);
    const path = findPath(makeCoord(0, 0), makeCoord(3, -3), map);
    expect(path).toBeNull();
  });
});

describe('ReachableTiles', () => {
  it('returns only tiles within move budget', () => {
    const tiles = [
      tile(0, 0),
      tile(1, -1),
      tile(2, -2),
      tile(0, -1),
    ];
    const map = makeMap(tiles);
    const reachable = reachableTiles(makeCoord(0, 0), 1, map);
    // With movePoints=1 we can only reach direct neighbors that are in the map
    const coords = reachable.map((t) => `${t.coord.q},${t.coord.r}`);
    expect(coords).not.toContain('2,-2'); // too far
    expect(coords).toContain('1,-1');
    expect(coords).toContain('0,-1');
  });

  it('excludes impassable tiles', () => {
    const tiles = [
      tile(0, 0),
      tile(1, -1, false),
      tile(0, -1),
    ];
    const map = makeMap(tiles);
    const reachable = reachableTiles(makeCoord(0, 0), 2, map);
    const coords = reachable.map((t) => `${t.coord.q},${t.coord.r}`);
    expect(coords).not.toContain('1,-1');
    expect(coords).toContain('0,-1');
  });
});
