import type { EnemyUnit } from '../../models/enemy';
import type { CombatEncounter } from '../../models/combat';

/**
 * Simple friendly NPC AI: move toward nearest enemy, attack if adjacent.
 * The NPC is a third-party actor registered in PhaseManager, excluded from
 * getPlayerControllableUnits(). (FR-012c)
 *
 * This is a v1 stub — no actual hex path calculation; the NPC acts symbolically.
 */
export function takeTurn(
  npc: EnemyUnit,
  _encounter: CombatEncounter,
): void {
  // v1: NPC acts but grid movement is not yet wired to the tactical grid.
  // PhaseManager should call this during the AI phase.
  if (npc.hp <= 0) return;
  // Move & attack is a no-op until full hex integration in a future task.
}
