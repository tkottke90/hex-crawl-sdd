import type { Character } from '../../models/character';
import type { EnemyUnit } from '../../models/enemy';
import type { CombatEncounter, CombatPhase } from '../../models/combat';
import type { HexTile } from '../../models/hex';

export interface CombatOverResult {
  over: boolean;
  winner: 'player' | 'enemy' | null;
}

export class CombatState {
  private encounter: CombatEncounter;
  private playerUnits: Character[];
  private enemyUnits: EnemyUnit[];

  constructor(
    encounter: CombatEncounter,
    playerUnits: Character[],
    enemyUnits: EnemyUnit[],
  ) {
    this.encounter = { ...encounter };
    this.playerUnits = playerUnits.map((c) => ({ ...c }));
    this.enemyUnits = enemyUnits.map((e) => ({ ...e }));
  }

  getEncounter(): CombatEncounter {
    return this.encounter;
  }

  getPhase(): CombatPhase {
    return this.encounter.phase;
  }

  isCombatOver(): CombatOverResult {
    const allEnemiesDead = this.enemyUnits.every((e) => e.status === 'dead');
    const allPlayersDead = this.playerUnits.every((c) => c.status === 'dead');

    if (allEnemiesDead) return { over: true, winner: 'player' };
    if (allPlayersDead) return { over: true, winner: 'enemy' };
    return { over: false, winner: null };
  }

  /** Returns HexTile[] that the given unit can move to (placeholder — wired via HexGridModule). */
  getValidMoveTargets(_characterId: string, allTiles: HexTile[]): HexTile[] {
    return allTiles.filter((t) => t.passable && t.occupants.length === 0);
  }

  getAttackTargets(attackerId: string): string[] {
    // Returns enemy IDs if attacker is a player unit, and vice-versa
    const isPlayer = this.playerUnits.some((c) => c.id === attackerId);
    if (isPlayer) {
      return this.enemyUnits.filter((e) => e.status !== 'dead').map((e) => e.id);
    }
    return this.playerUnits.filter((c) => c.status !== 'dead').map((c) => c.id);
  }

  updatePlayerUnit(updated: Character): void {
    const idx = this.playerUnits.findIndex((c) => c.id === updated.id);
    if (idx >= 0) this.playerUnits[idx] = { ...updated };
  }

  updateEnemyUnit(updated: EnemyUnit): void {
    const idx = this.enemyUnits.findIndex((e) => e.id === updated.id);
    if (idx >= 0) this.enemyUnits[idx] = { ...updated };
  }

  getPlayerUnits(): Character[] {
    return [...this.playerUnits];
  }

  getEnemyUnits(): EnemyUnit[] {
    return [...this.enemyUnits];
  }
}
