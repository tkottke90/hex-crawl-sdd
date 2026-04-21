import type { EnemyUnit } from '../../models/enemy';
import type { PRNG } from '../../utils/prng';

/**
 * Gold reward for a single enemy kill.
 * Formula: Math.floor(enemy.level * enemy.tier * (1 + prng.next()))
 * Deterministic for a given seeded PRNG.
 */
export function killReward(enemy: EnemyUnit, prng: PRNG): number {
  return Math.floor(enemy.level * enemy.tier * (1 + prng.next()));
}

/**
 * Bonus gold for clearing an entire camp.
 * Formula: Math.floor(avgLevel * 5)
 */
export function campClearBonus(enemies: EnemyUnit[]): number {
  if (enemies.length === 0) return 0;
  const avgLevel = enemies.reduce((sum, e) => sum + e.level, 0) / enemies.length;
  return Math.floor(avgLevel * 5);
}
