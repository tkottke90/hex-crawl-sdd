import { describe, expect, it } from 'vitest';
import { makeCoord } from '../../../src/modules/hex-grid/HexCoordUtils';
import {
  TILE_ANIMATION_CYCLE_MS,
  TILE_DISPLAY_SIZE,
  TILE_TEXTURE_SIZE,
  terrainFrameKey,
  tileDisplayScale,
  tileFrameIndexAtTime,
  tilePhaseOffsetMs,
} from '../../../src/modules/world-map/TilePresentation';

describe('TilePresentation', () => {
  it('uses a 2x footprint for the world map tiles', () => {
    expect(TILE_DISPLAY_SIZE).toBe(72);
    expect(TILE_DISPLAY_SIZE).toBe(2 * 36);
    expect(tileDisplayScale()).toBeCloseTo(TILE_DISPLAY_SIZE / TILE_TEXTURE_SIZE, 6);
  });

  it('creates stable per-terrain frame keys', () => {
    expect(terrainFrameKey('forest', 0)).toBe('tile-forest-frame-1');
    expect(terrainFrameKey('forest', 1)).toBe('tile-forest-frame-2');
  });

  it('derives deterministic phase offsets inside the animation cycle', () => {
    const coord = makeCoord(3, -2);
    const offset = tilePhaseOffsetMs(coord);

    expect(offset).toBeGreaterThanOrEqual(0);
    expect(offset).toBeLessThan(TILE_ANIMATION_CYCLE_MS);
    expect(tilePhaseOffsetMs(coord)).toBe(offset);
  });

  it('alternates between the two animation frames over time', () => {
    const coord = makeCoord(0, 0);

    expect(tileFrameIndexAtTime(coord, 0)).toBe(0);
    expect(tileFrameIndexAtTime(coord, TILE_ANIMATION_CYCLE_MS / 2)).toBe(1);
  });
});