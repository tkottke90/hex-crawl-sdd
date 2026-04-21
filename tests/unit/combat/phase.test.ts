import { describe, it, expect, beforeEach } from 'vitest';
import { PhaseManager } from '../../../src/modules/combat/PhaseManager';
import type { Character } from '../../../src/models/character';
import type { CombatEncounter } from '../../../src/models/combat';

function makeChar(id: string, role: 'pc' | 'escort' | 'adventurer' = 'pc'): Character {
  return {
    id,
    name: `Char-${id}`,
    role,
    classId: 'fighter',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    hp: 12,
    maxHp: 12,
    attributes: { str: 12, dex: 10, con: 12, int: 10, wis: 10, cha: 10 },
    portrait: 'char-pc',
    recruitmentSource: 'starting',
    status: 'active',
    statusEffects: [],
    deathRecord: null,
    actedThisPhase: false,
  };
}

function makeEncounter(playerIds: string[]): CombatEncounter {
  return {
    id: 'enc-1',
    phase: 'player',
    round: 1,
    playerUnits: playerIds,
    enemyUnits: ['e1'],
    friendlyNpcs: [],
    combatLog: [],
    resolution: null,
  };
}

describe('PhaseManager', () => {
  let pc1: Character;
  let pc2: Character;
  let encounter: CombatEncounter;
  let pm: PhaseManager;

  beforeEach(() => {
    pc1 = makeChar('pc1');
    pc2 = makeChar('pc2', 'escort');
    pc1.actedThisPhase = true;
    pc2.actedThisPhase = true;
    encounter = makeEncounter(['pc1', 'pc2']);
    pm = new PhaseManager(encounter, [pc1, pc2]);
  });

  it('startPlayerPhase resets actedThisPhase for all player units', () => {
    const updated = pm.startPlayerPhase();
    expect(updated.every((c) => c.actedThisPhase === false)).toBe(true);
  });

  it('startPlayerPhase sets encounter phase to player', () => {
    pm.startPlayerPhase();
    expect(pm.getPhase()).toBe('player');
  });

  it('endPlayerPhase transitions phase to enemy', () => {
    pm.startPlayerPhase();
    pm.endPlayerPhase();
    expect(pm.getPhase()).toBe('enemy');
  });

  it('after enemy phase completes, startPlayerPhase increments round', () => {
    pm.startPlayerPhase();
    pm.endPlayerPhase();
    pm.startPlayerPhase(); // round 2
    expect(pm.getRound()).toBe(2);
  });

  it('runEnemyPhase transitions back to player phase via callback', () => {
    pm.startPlayerPhase();
    pm.endPlayerPhase();
    // provide stub AI that does nothing
    pm.runEnemyPhase(() => ({}));
    expect(pm.getPhase()).toBe('player');
  });
});
