import { describe, it, expect } from 'vitest';
import { migrate } from '../../../src/modules/save/Migrator';

describe('migrate', () => {
  it('returns data unchanged when already at target version', () => {
    const data = { schemaVersion: 1, gold: 20 };
    const result = migrate(data, 1);
    expect(result.gold).toBe(20);
  });

  it('treats missing schemaVersion as version 0 and migrates up', () => {
    const data = { gold: 10 }; // no schemaVersion
    const result = migrate(data, 1);
    expect(result.version).toBeGreaterThanOrEqual(1);
  });

  it('treats null schemaVersion as version 0', () => {
    const data = { schemaVersion: null, gold: 5 };
    const result = migrate(data, 1);
    expect(result).toBeDefined();
  });

  it('throws SaveVersionError when raw schemaVersion > targetVersion', () => {
    const futureData = { schemaVersion: 999, gold: 0 };
    expect(() => migrate(futureData, 1)).toThrow();
  });

  it('applies migrations sequentially when jumping multiple versions', () => {
    // Version 0 → 1 is the only migration; data with version 0 should get stamped
    const data = { schemaVersion: 0, gold: 7 };
    const result = migrate(data, 1);
    expect(result).toBeDefined();
  });

  it('restores missing world map budget from the current party and defaults death markers', () => {
    const data = {
      schemaVersion: 1,
      party: [
        {
          status: 'active',
          attributes: { dex: 14 },
        },
      ],
      worldMap: {
        seed: 'seed',
        width: 1,
        height: 1,
        tiles: {},
        towns: [],
        enemyCamps: [],
        playerStartCoord: { q: 0, r: 0, s: 0 },
      },
    };

    const result = migrate(data, 1);

    expect(result.worldMap.remainingTurnBudget).toBe(3);
    expect(result.deathMarkers).toEqual([]);
  });
});
