import { describe, it, expect } from 'vitest';
import { generateMap } from '../../../src/modules/hex-grid/MapGenerator';

const TERRAIN_TYPES = new Set([
  'ocean', 'beach', 'grassland', 'forest', 'desert', 'mountain', 'snow',
]);

describe('MapGenerator', () => {
  it('produces identical maps for the same seed', () => {
    const a = generateMap('seed-abc', 20, 15);
    const b = generateMap('seed-abc', 20, 15);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('produces different maps for different seeds', () => {
    const a = generateMap('seed-abc', 20, 15);
    const b = generateMap('seed-xyz', 20, 15);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('all tiles have a valid TerrainType', () => {
    const map = generateMap('terrain-check', 15, 15);
    for (const tile of Object.values(map.tiles)) {
      expect(TERRAIN_TYPES.has(tile.terrain)).toBe(true);
    }
  });

  it('playerStartCoord points to a passable tile', () => {
    const map = generateMap('start-check', 20, 15);
    const key = `${map.playerStartCoord.q},${map.playerStartCoord.r},${map.playerStartCoord.s}`;
    const tile = map.tiles[key];
    expect(tile).toBeDefined();
    expect(tile.passable).toBe(true);
  });

  it('biome distribution: non-ocean tiles exist (island shaping)', () => {
    const map = generateMap('biome-dist', 20, 15);
    const terrains = Object.values(map.tiles).map((t) => t.terrain);
    const hasLand = terrains.some((t) => t !== 'ocean');
    expect(hasLand).toBe(true);
  });
});
