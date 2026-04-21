import { describe, it, expect } from 'vitest';
import { createCombatModule } from '../../../src/modules/combat/index';
import { PRNG } from '../../../src/utils/prng';
import type { Character } from '../../../src/models/character';
import type { EnemyUnit } from '../../../src/models/enemy';
import type { WorldMap } from '../../../src/models/world-map';
import type { GameMode } from '../../../src/models/save';
import type { HexTile } from '../../../src/models/hex';

function makeChar(id: string): Character {
  return {
    id,
    name: `Hero-${id}`,
    role: 'pc',
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

function makeEnemy(id: string): EnemyUnit {
  return {
    id,
    name: `Enemy-${id}`,
    tier: 1,
    classId: 'fighter',
    level: 1,
    hp: 8,
    maxHp: 8,
    attributes: { str: 10, dex: 10, con: 10, int: 8, wis: 8, cha: 8 },
    portrait: 'enemy',
    moveRange: 3,
    status: 'active',
    statusEffects: [],
  };
}

function makeTile(q: number, r: number): HexTile {
  return {
    coord: { q, r, s: -q - r },
    terrain: 'grassland',
    passable: true,
    moveCost: 1,
    poiTag: 'empty',
    occupants: [],
    fogOfWar: false,
    explored: false,
  };
}

function makeMap(): WorldMap {
  const tiles: Record<string, HexTile> = {};
  for (let q = -3; q <= 3; q++) {
    for (let r = -3; r <= 3; r++) {
      const s = -q - r;
      if (Math.abs(s) > 3) continue;
      const key = `${q},${r}`;
      tiles[key] = makeTile(q, r);
    }
  }
  // Place player at 0,0 and enemy at 1,0
  tiles['0,0'].occupants = ['pc1'];
  tiles['1,0'].occupants = ['e1'];
  return {
    seed: 'test',
    width: 7,
    height: 7,
    tiles,
    playerStartCoord: { q: 0, r: 0, s: 0 },
    towns: [],
    enemyCamps: [],
  };
}

describe('CombatModule player input guard', () => {
  const pc = makeChar('pc1');
  const enemy = makeEnemy('e1');
  const mode: GameMode = { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: true };
  const prng = new PRNG('guard-seed');

  it('getPlayerControllableUnits() returns player unit IDs during Player Phase', () => {
    const { module } = createCombatModule(
      { playerUnits: [pc], enemyUnits: [enemy], friendlyNpcs: [], mapContext: makeMap() },
      mode, prng,
    );
    const units = module.getPlayerControllableUnits();
    expect(units).toContain('pc1');
  });

  it('getPlayerControllableUnits() returns empty array during Enemy Phase', () => {
    const { module } = createCombatModule(
      { playerUnits: [pc], enemyUnits: [enemy], friendlyNpcs: [], mapContext: makeMap() },
      mode, prng,
    );
    module.endPlayerPhase();
    const units = module.getPlayerControllableUnits();
    expect(units).toHaveLength(0);
  });
});
