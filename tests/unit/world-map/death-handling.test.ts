import { describe, it, expect } from 'vitest';
import { applyCombatReturnState, createCombatDeathMarkers } from '../../../src/modules/world-map/CombatReturnState';
import { TurnBudgetManager } from '../../../src/modules/world-map/TurnBudgetManager';
import type { Character } from '../../../src/models/character';
import type { SaveState } from '../../../src/models/save';

function makeCharacter(name: string, role: Character['role'], status: Character['status'], turn = 4): Character {
  return {
    id: `${name}-${role}`,
    name,
    role,
    classId: 'fighter',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    hp: 0,
    maxHp: 10,
    attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    portrait: 'hero',
    recruitmentSource: 'starting',
    status,
    statusEffects: [],
    deathRecord: status === 'dead' ? { coord: { q: 2, r: -2, s: 0 }, turn } : null,
    actedThisPhase: false,
  };
}

function makeSaveState(): SaveState {
  return {
    version: 1,
    gameMode: { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: false },
    worldMap: {
      seed: 'seed',
      width: 10,
      height: 10,
      tiles: {},
      towns: [],
      enemyCamps: [],
      playerStartCoord: { q: 0, r: 0, s: 0 },
      remainingTurnBudget: 5,
    },
    party: [],
    deathMarkers: [{ coord: { q: 0, r: 0, s: 0 }, name: 'Existing' }],
    deathHistory: [{ coord: { q: 0, r: 0, s: 0 }, turn: 1 }],
    invalidated: false,
    towns: [],
    enemyCamps: [],
    activeCombat: null,
    currentLocation: { q: 0, r: 0, s: 0 },
    gold: 0,
    timestamp: '2026-04-22T00:00:00.000Z',
    metaProgression: { schemaVersion: 1 },
  };
}

describe('CombatReturnState', () => {
  it('creates markers for dead non-PC party members', () => {
    const markers = createCombatDeathMarkers([
      makeCharacter('Hero', 'pc', 'active'),
      makeCharacter('Ward', 'escort', 'dead'),
      makeCharacter('Scout', 'adventurer', 'dead'),
    ]);

    expect(markers).toEqual([
      { coord: { q: 2, r: -2, s: 0 }, name: 'Ward' },
      { coord: { q: 2, r: -2, s: 0 }, name: 'Scout' },
    ]);
  });

  it('merges return state by removing dead non-PCs and appending their markers', () => {
    const saveState = makeSaveState();
    const updated = applyCombatReturnState(saveState, [
      makeCharacter('Hero', 'pc', 'active'),
      makeCharacter('Ward', 'escort', 'dead'),
      makeCharacter('Scout', 'adventurer', 'active'),
    ]);

    expect(updated.party.map((ch) => ch.name)).toEqual(['Hero', 'Scout']);
    expect(updated.deathMarkers).toEqual([
      { coord: { q: 0, r: 0, s: 0 }, name: 'Existing' },
      { coord: { q: 2, r: -2, s: 0 }, name: 'Ward' },
    ]);
    expect(updated.deathHistory).toHaveLength(2);
    expect(TurnBudgetManager.fromParty(updated.party).getRemaining()).toBe(2);
  });
});
