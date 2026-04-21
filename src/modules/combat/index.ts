import type { Character } from '../../models/character';
import type { EnemyUnit } from '../../models/enemy';
import type { WorldMap } from '../../models/world-map';
import type { CombatEncounter, CombatLogEntry, CombatResolution } from '../../models/combat';
import type { HexCoord, HexTile } from '../../models/hex';
import type { GameMode } from '../../models/save';
import type { PRNG } from '../../utils/prng';
import { CombatState } from './CombatState';
import { PhaseManager } from './PhaseManager';
import { DiceResolver, type AttackResult } from './DiceResolver';
import { ModeRules } from './ModeRules';
import { ItemService } from './ItemService';

export interface EncounterConfig {
  playerUnits: Character[];
  enemyUnits: EnemyUnit[];
  friendlyNpcs: EnemyUnit[];
  mapContext: WorldMap;
}

export interface MoveResult {
  success: boolean;
  reason?: 'out-of-range' | 'tile-blocked' | 'already-acted' | 'wrong-phase';
}

export interface CombatModule {
  getActiveEncounter(): CombatEncounter | null;
  moveUnit(characterId: string, target: HexCoord): MoveResult;
  attack(attackerId: string, targetId: string): AttackResult & { success: boolean };
  wait(characterId: string): void;
  endPlayerPhase(): void;
  getMovementRange(characterId: string): HexTile[];
  getAttackTargets(characterId: string, fromCoord: HexCoord): string[];
  getPlayerControllableUnits(): string[];
  getPlayerUnits(): Character[];
  getEnemyUnits(): EnemyUnit[];
}

type EventCallback = (event: string, payload: unknown) => void;

export function createCombatModule(
  config: EncounterConfig,
  mode: GameMode,
  prng: PRNG,
): { module: CombatModule; onEvent: (cb: EventCallback) => void } {
  const callbacks: EventCallback[] = [];

  function emit(event: string, payload: unknown): void {
    callbacks.forEach((cb) => cb(event, payload));
  }

  const initialEncounter: CombatEncounter = {
    id: crypto.randomUUID(),
    phase: 'player',
    round: 1,
    playerUnits: config.playerUnits.map((c) => c.id),
    enemyUnits: config.enemyUnits.map((e) => e.id),
    friendlyNpcs: config.friendlyNpcs.map((e) => e.id),
    combatLog: [],
    resolution: null,
  };

  const state = new CombatState(initialEncounter, config.playerUnits, config.enemyUnits);
  const pm = new PhaseManager(initialEncounter, config.playerUnits);
  const resolver = new DiceResolver();

  emit('combat:started', { encounter: initialEncounter });

  function runEnemyAI(): void {
    // Simple enemy AI: enemies attack first available player unit (array order)
    const enemies = state.getEnemyUnits().filter((e) => e.hp > 0);
    for (const enemy of enemies) {
      const target = state.getPlayerUnits().find((c) => c.status !== 'dead');
      if (!target) break;

      const enemyChar: Character = {
        id: enemy.id,
        name: enemy.name,
        role: 'adventurer',
        classId: enemy.classId,
        level: enemy.level,
        xp: 0,
        xpToNextLevel: 999,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        attributes: enemy.attributes,
        portrait: enemy.portrait,
        recruitmentSource: 'hired',
        status: 'active',
        statusEffects: [],
        deathRecord: null,
        actedThisPhase: false,
      };

      const result = resolver.resolveAttack(enemyChar, target, prng);
      const updatedTarget = { ...target, hp: result.targetHpAfter };

      if (result.targetDefeated) {
        const defeated = ModeRules.applyDefeat(updatedTarget, mode, { q: 0, r: 0, s: 0 }, pm.getRound());
        state.updatePlayerUnit(defeated);
        emit('combat:unit-defeated', { unitId: target.id, isPlayerUnit: true });
      } else {
        state.updatePlayerUnit(updatedTarget);
      }

      emit('combat:action', {
        entry: {
          round: pm.getRound(),
          phase: 'enemy',
          actorId: enemy.id,
          action: 'attack',
          roll: result.roll,
          targetId: target.id,
          hpDelta: -result.damageDone,
          narrative: `${enemy.name} attacks ${target.name} for ${result.damageDone} damage`,
        } satisfies CombatLogEntry,
      });
    }

    pm.runEnemyPhase(() => ({}));
    emit('combat:phase-changed', { phase: 'player', round: pm.getRound() });
  }

  const module: CombatModule = {
    getActiveEncounter(): CombatEncounter | null {
      return state.getEncounter();
    },

    moveUnit(characterId: string, _target: HexCoord): MoveResult {
      if (pm.getPhase() !== 'player') {
        return { success: false, reason: 'wrong-phase' };
      }
      const char = state.getPlayerUnits().find((c) => c.id === characterId);
      if (!char) return { success: false, reason: 'out-of-range' };
      if (char.actedThisPhase) return { success: false, reason: 'already-acted' };
      // Actual pathfinding deferred — mark as acted
      state.updatePlayerUnit({ ...char, actedThisPhase: true });
      return { success: true };
    },

    attack(attackerId: string, targetId: string): AttackResult & { success: boolean } {
      if (pm.getPhase() !== 'player') {
        return { success: false, roll: null!, damageDone: 0, targetHpAfter: 0, targetDefeated: false };
      }
      const attacker = state.getPlayerUnits().find((c) => c.id === attackerId);
      const enemy = state.getEnemyUnits().find((e) => e.id === targetId);
      if (!attacker || !enemy) {
        return { success: false, roll: null!, damageDone: 0, targetHpAfter: 0, targetDefeated: false };
      }

      // Convert EnemyUnit to Character shape for resolver
      const defenderChar: Character = {
        id: enemy.id,
        name: enemy.name,
        role: 'adventurer',
        classId: enemy.classId,
        level: enemy.level,
        xp: 0,
        xpToNextLevel: 999,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        attributes: enemy.attributes,
        portrait: enemy.portrait,
        recruitmentSource: 'hired',
        status: 'active',
        statusEffects: [],
        deathRecord: null,
        actedThisPhase: false,
      };

      const result = resolver.resolveAttack(attacker, defenderChar, prng);

      const logEntry: CombatLogEntry = {
        round: pm.getRound(),
        phase: 'player',
        actorId: attackerId,
        action: 'attack',
        roll: result.roll,
        targetId,
        hpDelta: -result.damageDone,
        narrative: `${attacker.name} attacks ${enemy.name} for ${result.damageDone} damage`,
      };
      emit('combat:action', { entry: logEntry });

      // Apply HP change to enemy
      const updatedEnemy = { ...enemy, hp: result.targetHpAfter };
      if (result.targetDefeated) {
        const defeated = ModeRules.applyDefeat(
          defenderChar, mode, { q: 0, r: 0, s: 0 }, pm.getRound(),
        );
        updatedEnemy.hp = defeated.hp;
        emit('combat:unit-defeated', { unitId: targetId, isPlayerUnit: false });
      }
      state.updateEnemyUnit(updatedEnemy);

      const combatOver = state.isCombatOver();
      if (combatOver.over) {
        const resolution: CombatResolution = {
          outcome: combatOver.winner === 'player' ? 'player-victory' : 'player-defeat',
          survivingFriendlyNpcIds: [],
          recruitmentOffered: false,
        };
        emit('combat:resolved', { resolution });
      }

      return { success: true, ...result };
    },

    wait(characterId: string): void {
      const char = state.getPlayerUnits().find((c) => c.id === characterId);
      if (char) {
        state.updatePlayerUnit({ ...char, actedThisPhase: true });
        emit('combat:action', {
          entry: {
            round: pm.getRound(),
            phase: 'player',
            actorId: characterId,
            action: 'wait',
            roll: null,
            targetId: null,
            hpDelta: null,
            narrative: `${char.name} waits.`,
          } satisfies CombatLogEntry,
        });
      }
    },

    endPlayerPhase(): void {
      pm.endPlayerPhase();
      emit('combat:phase-changed', { phase: 'enemy', round: pm.getRound() });
      // Enemy AI runs asynchronously via setTimeout to allow phase queries between transitions
      setTimeout(() => {
        runEnemyAI();
      }, 0);
    },

    getMovementRange(_characterId: string): HexTile[] {
      return [];
    },

    getAttackTargets(characterId: string, _fromCoord: HexCoord): string[] {
      return state.getAttackTargets(characterId);
    },

    getPlayerControllableUnits(): string[] {
      if (pm.getPhase() !== 'player') return [];
      return state.getPlayerUnits().map((c) => c.id);
    },

    getPlayerUnits(): Character[] {
      return state.getPlayerUnits();
    },

    getEnemyUnits(): EnemyUnit[] {
      return state.getEnemyUnits();
    },
  };

  return {
    module,
    onEvent: (cb: EventCallback) => { callbacks.push(cb); },
  };
}

export { ItemService };
