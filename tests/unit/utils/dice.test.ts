import { describe, it, expect } from 'vitest';
import { DiceRoller } from '../../../src/utils/dice';
import { PRNG } from '../../../src/utils/prng';

describe('DiceRoller', () => {
  it('parses "1d6" notation', () => {
    const prng = new PRNG('dice-seed');
    const roller = new DiceRoller();
    const result = roller.roll('1d6', prng);
    expect(result.dice).toHaveLength(1);
    expect(result.modifier).toBe(0);
    expect(result.dice[0]).toBeGreaterThanOrEqual(1);
    expect(result.dice[0]).toBeLessThanOrEqual(6);
    expect(result.total).toBe(result.dice[0]);
  });

  it('parses "2d6+3" notation', () => {
    const prng = new PRNG('mod-seed');
    const roller = new DiceRoller();
    const result = roller.roll('2d6+3', prng);
    expect(result.dice).toHaveLength(2);
    expect(result.modifier).toBe(3);
    expect(result.total).toBe(result.dice[0] + result.dice[1] + 3);
  });

  it('parses "1d20-2" negative modifier', () => {
    const prng = new PRNG('neg-seed');
    const roller = new DiceRoller();
    const result = roller.roll('1d20-2', prng);
    expect(result.modifier).toBe(-2);
    expect(result.total).toBe(result.dice[0] - 2);
  });

  it('detects critical (nat 20 on d20)', () => {
    // Use a PRNG that deterministically produces a value very close to 1 (producing 20)
    const prng = new PRNG('crit-test');
    const roller = new DiceRoller();
    // Roll many times and collect crits
    let foundCrit = false;
    for (let i = 0; i < 1000; i++) {
      const result = roller.roll('1d20', prng);
      if (result.isCritical) {
        expect(result.dice[0]).toBe(20);
        foundCrit = true;
        break;
      }
    }
    expect(foundCrit).toBe(true);
  });

  it('detects fumble (nat 1 on d20)', () => {
    const prng = new PRNG('fumble-test');
    const roller = new DiceRoller();
    let foundFumble = false;
    for (let i = 0; i < 1000; i++) {
      const result = roller.roll('1d20', prng);
      if (result.isFumble) {
        expect(result.dice[0]).toBe(1);
        foundFumble = true;
        break;
      }
    }
    expect(foundFumble).toBe(true);
  });

  it('is reproducible with identical PRNG seed', () => {
    const prngA = new PRNG('repro');
    const prngB = new PRNG('repro');
    const roller = new DiceRoller();
    const a = roller.roll('3d6+2', prngA);
    const b = roller.roll('3d6+2', prngB);
    expect(a.dice).toEqual(b.dice);
    expect(a.total).toBe(b.total);
  });

  it('throws on invalid notation', () => {
    const prng = new PRNG('err-seed');
    const roller = new DiceRoller();
    expect(() => roller.roll('notdice', prng)).toThrow();
  });
});
