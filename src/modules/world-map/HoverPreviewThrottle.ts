import type { HexCoord } from '../../models/hex';

export function isSameHexCoord(a: HexCoord | null, b: HexCoord | null): boolean {
  if (a == null || b == null) return false;
  return a.q === b.q && a.r === b.r && a.s === b.s;
}

export function shouldRecomputeHoverPreview(previous: HexCoord | null, next: HexCoord | null): boolean {
  if (next == null) return false;
  return !isSameHexCoord(previous, next);
}
