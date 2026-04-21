import { createNoise2D as _createNoise2D } from 'simplex-noise';
import { PRNG } from './prng';

/**
 * Returns a seeded 2D noise function whose output is normalised to [0, 1].
 * The raw simplex-noise output is in [-1, 1]; we map it to [0, 1].
 */
export function createNoise2D(seed: string): (x: number, y: number) => number {
  const prng = new PRNG(seed);
  const rawNoise = _createNoise2D(() => prng.next());
  return (x: number, y: number): number => (rawNoise(x, y) + 1) / 2;
}
