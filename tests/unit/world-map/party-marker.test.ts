import { describe, expect, it } from 'vitest';
import { toPixel, makeCoord } from '../../../src/modules/hex-grid/HexCoordUtils';
import {
  TILE_DISPLAY_SIZE,
  partyMarkerDepth,
  partyMarkerDisplaySize,
  partyMarkerWorldPosition,
} from '../../../src/modules/world-map/TilePresentation';

describe('party marker presentation', () => {
  it('centers the party marker on the occupied hex using the 2x tile footprint', () => {
    const coord = makeCoord(2, -1);

    expect(partyMarkerWorldPosition(coord)).toEqual(toPixel(coord, TILE_DISPLAY_SIZE));
  });

  it('keeps the party marker above the terrain art', () => {
    expect(partyMarkerDisplaySize()).toBeCloseTo(TILE_DISPLAY_SIZE * 2 * 0.58, 6);
    expect(partyMarkerDepth()).toBe(10);
  });
});