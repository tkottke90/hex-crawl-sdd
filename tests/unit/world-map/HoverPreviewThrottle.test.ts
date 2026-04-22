import { describe, it, expect } from 'vitest';
import { isSameHexCoord, shouldRecomputeHoverPreview } from '../../../src/modules/world-map/HoverPreviewThrottle';

describe('HoverPreviewThrottle', () => {
  it('treats the same coordinate as the same hover tile', () => {
    const coord = { q: 2, r: -2, s: 0 };
    expect(isSameHexCoord(coord, { ...coord })).toBe(true);
  });

  it('recomputes only when the cursor enters a new tile', () => {
    const previous = { q: 1, r: -1, s: 0 };
    expect(shouldRecomputeHoverPreview(previous, { ...previous })).toBe(false);
    expect(shouldRecomputeHoverPreview(previous, { q: 2, r: -2, s: 0 })).toBe(true);
  });
});
