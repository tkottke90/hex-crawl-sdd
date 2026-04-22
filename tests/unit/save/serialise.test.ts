import { describe, it, expect } from 'vitest';
import { serialise } from '../../../src/modules/save/Serialiser';
import { SaveStateSchema } from '../../../src/schemas/save.schema';
import type { SaveState } from '../../../src/models/save';

function makeMinimalSaveState(): Parameters<typeof serialise>[0] {
  return {
    gameMode: { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: false },
    worldMap: {
      seed: 'test_seed',
      width: 5,
      height: 5,
      tiles: {},
      towns: [],
      enemyCamps: [],
      playerStartCoord: { q: 0, r: 0, s: 0 },
    },
    party: [],
    deathMarkers: [],
    deathHistory: [],
    invalidated: false,
    towns: [],
    enemyCamps: [],
    activeCombat: null,
    currentLocation: { q: 0, r: 0, s: 0 },
    gold: 20,
    metaProgression: { schemaVersion: 1 },
  };
}

describe('Serialiser.serialise', () => {
  it('produces valid JSON-serialisable output', () => {
    const state = makeMinimalSaveState();
    const result = serialise(state);
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it('output passes SaveStateSchema.safeParse()', () => {
    const state = makeMinimalSaveState();
    const result = serialise(state);
    const parsed = SaveStateSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it('stamps a version field', () => {
    const state = makeMinimalSaveState();
    const result = serialise(state);
    expect(result.version).toBeTypeOf('number');
    expect(result.version).toBeGreaterThanOrEqual(1);
  });

  it('stamps a timestamp string', () => {
    const state = makeMinimalSaveState();
    const result = serialise(state);
    expect(result.timestamp).toBeTypeOf('string');
    expect(result.timestamp.length).toBeGreaterThan(0);
  });

  it('preserves gold and currentLocation', () => {
    const state = makeMinimalSaveState();
    state.gold = 42;
    state.currentLocation = { q: 3, r: -1, s: -2 };
    const result = serialise(state);
    expect(result.gold).toBe(42);
    expect(result.currentLocation).toEqual({ q: 3, r: -1, s: -2 });
  });

  it('preserves invalidated flag', () => {
    const state = makeMinimalSaveState();
    state.invalidated = true;
    const result = serialise(state);
    expect(result.invalidated).toBe(true);
  });

  it('preserves death markers and remaining turn budget', () => {
    const state = makeMinimalSaveState();
    state.deathMarkers = [{ coord: { q: 2, r: -2, s: 0 }, name: 'Ward' }];
    state.worldMap.remainingTurnBudget = 3;

    const result = serialise(state);
    expect(result.deathMarkers).toEqual([{ coord: { q: 2, r: -2, s: 0 }, name: 'Ward' }]);
    expect(result.worldMap.remainingTurnBudget).toBe(3);
  });
});

describe('SaveStateSchema round-trip', () => {
  it('round-trips a full SaveState via JSON.stringify / JSON.parse', () => {
    const validSave: Partial<SaveState> = {
      version: 1,
      gameMode: { type: 'roguelike', allowManualSave: false, autoSaveOnCheckpoint: true },
      worldMap: {
        seed: 'abc',
        width: 2,
        height: 2,
        tiles: {},
        towns: [],
        enemyCamps: [],
        playerStartCoord: { q: 0, r: 0, s: 0 },
      },
      party: [],
      deathMarkers: [],
      deathHistory: [],
      invalidated: false,
      towns: [],
      enemyCamps: [],
      activeCombat: null,
      currentLocation: { q: 0, r: 0, s: 0 },
      gold: 20,
      timestamp: new Date().toISOString(),
      metaProgression: { schemaVersion: 1 },
    };
    const parsed = SaveStateSchema.safeParse(JSON.parse(JSON.stringify(validSave)));
    expect(parsed.success).toBe(true);
  });
});
