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

  // T003 — US1: base-36 format seeds behave deterministically and produce unique maps
  describe('US1: seed uniqueness and determinism (base-36 format)', () => {
    it('two distinct base-36 format seeds produce non-identical tile layouts', () => {
      // Use static base-36 style seeds; use full game map size so island shaping creates land
      const seedA = 'lrno8owk3x7mq2p';
      const seedB = 'mx3p9qrst5v2uwy4';
      const a = generateMap(seedA, 40, 30);
      const b = generateMap(seedB, 40, 30);
      expect(JSON.stringify(a.tiles)).not.toBe(JSON.stringify(b.tiles));
    });

    it('same base-36 seed always reconstructs an identical map', () => {
      const seed = `lrno8owk3x7mq2p`;
      const a = generateMap(seed, 40, 30);
      const b = generateMap(seed, 40, 30);
      expect(JSON.stringify(a.tiles)).toBe(JSON.stringify(b.tiles));
    });
  });

  // T004 — US2: border tiles are always ocean and impassable
  describe('US2: water border guarantee', () => {
    const W = 20;
    const H = 15;

    it('all border tiles have terrain === ocean', () => {
      const map = generateMap('border-check', W, H);
      for (const tile of Object.values(map.tiles)) {
        const qi = tile.coord.q + Math.floor(tile.coord.r / 2);
        const r = tile.coord.r;
        const isBorder = r < 2 || r >= H - 2 || qi < 2 || qi >= W - 2;
        if (isBorder) {
          expect(tile.terrain).toBe('ocean');
        }
      }
    });

    it('all border tiles are impassable', () => {
      const map = generateMap('border-passable', W, H);
      for (const tile of Object.values(map.tiles)) {
        const qi = tile.coord.q + Math.floor(tile.coord.r / 2);
        const r = tile.coord.r;
        const isBorder = r < 2 || r >= H - 2 || qi < 2 || qi >= W - 2;
        if (isBorder) {
          expect(tile.passable).toBe(false);
        }
      }
    });

    it('inner tiles are not all ocean (noise still applies inside the border)', () => {
      const map = generateMap('inner-biome', W, H);
      const innerLandTiles = Object.values(map.tiles).filter((tile) => {
        const qi = tile.coord.q + Math.floor(tile.coord.r / 2);
        const r = tile.coord.r;
        const isInner = r >= 2 && r < H - 2 && qi >= 2 && qi < W - 2;
        return isInner && tile.terrain !== 'ocean';
      });
      expect(innerLandTiles.length).toBeGreaterThan(0);
    });
  });

  // T007 — US3: playerStartCoord is always in the bottom-center start region
  describe('US3: player start region constraint', () => {
    const W = 40;
    const H = 30;
    const seeds = [
      'lrno8owk3x7mq2p',
      'lrno9xyz1a2b3c4',
      'start-region-a',
      'start-region-b',
      'start-region-c',
    ];

    for (const seed of seeds) {
      it(`playerStartCoord is in bottom half and center horizontal half for seed "${seed}"`, () => {
        const map = generateMap(seed, W, H);
        const r = map.playerStartCoord.r;
        const qi = map.playerStartCoord.q + Math.floor(r / 2);
        expect(r).toBeGreaterThanOrEqual(Math.floor(H / 2));
        expect(qi).toBeGreaterThanOrEqual(Math.floor(W / 4));
        expect(qi).toBeLessThan(W - Math.floor(W / 4));
      });

      it(`playerStartCoord tile is passable for seed "${seed}"`, () => {
        const map = generateMap(seed, W, H);
        const { q, r, s } = map.playerStartCoord;
        const tile = map.tiles[`${q},${r},${s}`];
        expect(tile).toBeDefined();
        expect(tile.passable).toBe(true);
      });
    }
  });
});
