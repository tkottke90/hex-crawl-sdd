import { describe, expect, it } from 'vitest';
import { makeCoord } from '../../../src/modules/hex-grid/HexCoordUtils';
import { TILE_ANIMATION_CYCLE_MS, tileFrameIndexAtTime, tilePhaseOffsetMs } from '../../../src/modules/world-map/TilePresentation';

describe('tile animation', () => {
  it('uses deterministic phase offsets per tile', () => {
    const coord = makeCoord(3, -2);
    const offset = tilePhaseOffsetMs(coord);

    expect(offset).toBeGreaterThanOrEqual(0);
    expect(offset).toBeLessThan(TILE_ANIMATION_CYCLE_MS);
    expect(tilePhaseOffsetMs(coord)).toBe(offset);
  });

  it('alternates the visible frame across the two-state cycle', () => {
    const coord = makeCoord(0, 0);

    expect(tileFrameIndexAtTime(coord, 0)).toBe(0);
    expect(tileFrameIndexAtTime(coord, TILE_ANIMATION_CYCLE_MS / 2)).toBe(1);
  });
});