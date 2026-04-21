/**
 * Seedable xoshiro128** PRNG (pure — no Phaser dependency).
 * Reference: https://prng.di.unimi.it/xoshiro128starstar.c
 */
export class PRNG {
  private s: Uint32Array;

  constructor(seed: string) {
    this.s = new Uint32Array(4);
    // Simple string hash to initialise the 4 state words
    let h = 0x9e3779b9;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 0x517cc1b727220a95 | 0);
    }
    // Splitmix32 to fill 4 words from h
    for (let i = 0; i < 4; i++) {
      h += 0x9e3779b9;
      let z = h;
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
      this.s[i] = z ^ (z >>> 16);
    }
    // Ensure at least one non-zero state word
    if (this.s.every((v) => v === 0)) this.s[0] = 1;
  }

  /** Returns a pseudo-random float in [0, 1). */
  next(): number {
    const result = this.rotl(Math.imul(this.s[1], 5), 7) * 9;
    const t = this.s[1] << 9;
    this.s[2] ^= this.s[0];
    this.s[3] ^= this.s[1];
    this.s[1] ^= this.s[2];
    this.s[0] ^= this.s[3];
    this.s[2] ^= t;
    this.s[3] = this.rotl(this.s[3], 11);
    return (result >>> 0) / 0x100000000;
  }

  /** Returns a pseudo-random integer in [min, max] (inclusive). */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  private rotl(x: number, k: number): number {
    return (x << k) | (x >>> (32 - k));
  }
}
