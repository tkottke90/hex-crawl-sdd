import { describe, it, expect } from 'vitest';
import {
  makeCoord,
  neighbors,
  distance,
  toPixel,
  fromPixel,
} from '../../../src/modules/hex-grid/HexCoordUtils';

describe('HexCoordUtils', () => {
  it('makeCoord creates valid coord with q+r+s===0', () => {
    const c = makeCoord(1, -1);
    expect(c.q).toBe(1);
    expect(c.r).toBe(-1);
    expect(c.s).toBe(0);
    expect(c.q + c.r + c.s).toBe(0);
  });

  it('makeCoord always satisfies q+r+s===0 (s is derived)', () => {
    // makeCoord(q, r) always computes s = -q-r, so invariant is always satisfied
    const c = makeCoord(1, 1);
    expect(c.q + c.r + c.s).toBe(0);
    expect(c.s).toBe(-2);
  });

  it('neighbors returns exactly 6 adjacent coords', () => {
    const c = makeCoord(0, 0);
    const ns = neighbors(c);
    expect(ns).toHaveLength(6);
    for (const n of ns) {
      expect(n.q + n.r + n.s).toBe(0);
    }
  });

  it('distance from origin to self is 0', () => {
    const c = makeCoord(0, 0);
    expect(distance(c, c)).toBe(0);
  });

  it('distance between neighboring coords is 1', () => {
    const a = makeCoord(0, 0);
    const b = makeCoord(1, -1);
    expect(distance(a, b)).toBe(1);
  });

  it('distance is symmetric', () => {
    const a = makeCoord(2, -3);
    const b = makeCoord(-1, 2);
    expect(distance(a, b)).toBe(distance(b, a));
  });

  it('toPixel / fromPixel round-trip (pointy-top)', () => {
    const size = 32;
    const c = makeCoord(3, -2);
    const px = toPixel(c, size);
    const back = fromPixel(px.x, px.y, size);
    expect(back.q).toBe(c.q);
    expect(back.r).toBe(c.r);
    expect(back.s).toBe(c.s);
  });
});
