import type { HexCoord } from '../../models/hex';

const SQRT3 = Math.sqrt(3);

// Cube-coordinate direction vectors (pointy-top orientation)
const DIRECTIONS: [number, number, number][] = [
  [1, -1, 0],
  [1, 0, -1],
  [0, 1, -1],
  [-1, 1, 0],
  [-1, 0, 1],
  [0, -1, 1],
];

/**
 * Create a HexCoord, asserting the q+r+s===0 invariant.
 * Computes s automatically from q and r.
 */
export function makeCoord(q: number, r: number): HexCoord {
  const s = -q - r;
  if (q + r + s !== 0) {
    throw new Error(`HexCoord invariant violated: q=${q} r=${r} s=${s}`);
  }
  return { q, r, s };
}

/** Returns the 6 adjacent hex coordinates. */
export function neighbors(coord: HexCoord): HexCoord[] {
  return DIRECTIONS.map(([dq, dr, ds]) => ({
    q: coord.q + dq,
    r: coord.r + dr,
    s: coord.s + ds,
  }));
}

/** Cube-coordinate distance between two hexes. */
export function distance(a: HexCoord, b: HexCoord): number {
  return Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs(a.s - b.s),
  );
}

/**
 * Convert hex coord to pixel position (pointy-top orientation).
 * @param size - hex size (centre to vertex)
 */
export function toPixel(coord: HexCoord, size: number): { x: number; y: number } {
  const x = size * (SQRT3 * coord.q + (SQRT3 / 2) * coord.r);
  const y = size * (1.5 * coord.r);
  return { x, y };
}

/**
 * Convert pixel position back to the nearest hex coord (pointy-top).
 * Uses cube rounding to snap to the closest tile.
 */
export function fromPixel(x: number, y: number, size: number): HexCoord {
  const r = y / (size * 1.5);
  const q = (x - (SQRT3 / 2) * size * r) / (SQRT3 * size);
  return cubeRound(q, r, -q - r);
}

function cubeRound(fq: number, fr: number, fs: number): HexCoord {
  let q = Math.round(fq);
  let r = Math.round(fr);
  let s = Math.round(fs);

  const dq = Math.abs(q - fq);
  const dr = Math.abs(r - fr);
  const ds = Math.abs(s - fs);

  if (dq > dr && dq > ds) {
    q = -r - s;
  } else if (dr > ds) {
    r = -q - s;
  } else {
    s = -q - r;
  }

  return { q, r, s };
}
