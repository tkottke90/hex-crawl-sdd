import { describe, it, expect } from 'vitest';
import { PRNG } from '../../../src/utils/prng';

describe('PRNG', () => {
  it('produces the same sequence given the same seed', () => {
    const a = new PRNG('test-seed');
    const b = new PRNG('test-seed');
    const samplesA = Array.from({ length: 20 }, () => a.next());
    const samplesB = Array.from({ length: 20 }, () => b.next());
    expect(samplesA).toEqual(samplesB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new PRNG('seed-alpha');
    const b = new PRNG('seed-beta');
    const samplesA = Array.from({ length: 10 }, () => a.next());
    const samplesB = Array.from({ length: 10 }, () => b.next());
    expect(samplesA).not.toEqual(samplesB);
  });

  it('next() values are in [0, 1)', () => {
    const prng = new PRNG('range-check');
    for (let i = 0; i < 1000; i++) {
      const v = prng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('nextInt(min, max) values are within [min, max]', () => {
    const prng = new PRNG('int-check');
    for (let i = 0; i < 200; i++) {
      const v = prng.nextInt(3, 10);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(10);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('has reasonable uniform distribution (spot-check buckets)', () => {
    const prng = new PRNG('distribution');
    const buckets = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5000; i++) {
      const idx = Math.floor(prng.next() * 5);
      buckets[idx]++;
    }
    // Each bucket should get roughly 1000 hits; allow 30% deviation
    for (const count of buckets) {
      expect(count).toBeGreaterThan(700);
      expect(count).toBeLessThan(1300);
    }
  });
});
