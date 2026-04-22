import { describe, it, expect } from 'vitest';
import { computeTurnBudget, dexModifier, TurnBudgetManager } from '../../../src/modules/world-map/TurnBudgetManager';
import type { Character } from '../../../src/models/character';

function makeCharacter(dex: number, status: 'active' | 'dead' = 'active'): Character {
  return {
    id: crypto.randomUUID(),
    name: 'Test',
    role: 'adventurer',
    classId: 'fighter',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    hp: 10,
    maxHp: 10,
    attributes: { str: 10, dex, con: 10, int: 10, wis: 10, cha: 10 },
    portrait: 'hero',
    recruitmentSource: 'starting',
    status,
    statusEffects: [],
    deathRecord: null,
    actedThisPhase: false,
  };
}

describe('TurnBudgetManager', () => {
  it('maps stats to the expected dex modifier values', () => {
    expect(dexModifier(10)).toBe(0);
    expect(dexModifier(11)).toBe(1);
    expect(dexModifier(12)).toBe(1);
    expect(dexModifier(13)).toBe(2);
    expect(dexModifier(8)).toBe(-1);
    expect(dexModifier(7)).toBe(-2);
  });

  it('computes turn budget using active party members only', () => {
    const party = [makeCharacter(12), makeCharacter(18), makeCharacter(2, 'dead')];
    expect(computeTurnBudget(party)).toBe(1 + 1 + 4);
  });

  it('never goes below the minimum move range', () => {
    const party = [makeCharacter(2), makeCharacter(2)];
    expect(computeTurnBudget(party)).toBe(2);
  });

  it('tracks remaining budget across consume and reset operations', () => {
    const manager = new TurnBudgetManager(4);
    expect(manager.getRemaining()).toBe(4);
    expect(manager.consume(2)).toBe(2);
    expect(manager.consume(20)).toBe(0);
    expect(manager.resetBudget([makeCharacter(14)])).toBe(3);
    expect(manager.getRemaining()).toBe(3);
  });
});
