import { describe, it, expect } from 'vitest';
import { createNoise2D } from '../../../src/utils/noise';

describe('noise', () => {
  it('produces the same values for the same seed', () => {
    const noiseA = createNoise2D('same-seed');
    const noiseB = createNoise2D('same-seed');
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        expect(noiseA(x, y)).toBe(noiseB(x, y));
      }
    }
  });

  it('produces different values for different seeds', () => {
    const noiseA = createNoise2D('seed-one');
    const noiseB = createNoise2D('seed-two');
    const diffs = [];
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        diffs.push(noiseA(x, y) !== noiseB(x, y));
      }
    }
    expect(diffs.some(Boolean)).toBe(true);
  });

  it('outputs values in [0, 1]', () => {
    const noise = createNoise2D('range-seed');
    for (let x = -10; x <= 10; x++) {
      for (let y = -10; y <= 10; y++) {
        const v = noise(x, y);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
