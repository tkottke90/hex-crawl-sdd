import type { CombatEncounter } from '../../models/combat';
import type { EnemyUnit } from '../../models/enemy';
import type { PRNG } from '../../utils/prng';

export interface RecruitmentEvent {
  npcId: string;
  npcUnit: EnemyUnit;
}

const RECRUITMENT_CHANCE = 0.1;

/**
 * Roll whether a recruitment encounter triggers at combat start.
 * If triggered, a random friendly NPC ID is selected and resolved via unitLookup.
 * Returns null if no friendly NPCs or roll fails.
 */
export function rollRecruitmentEncounter(
  encounter: CombatEncounter,
  unitLookup: Record<string, EnemyUnit>,
  prng: PRNG,
): RecruitmentEvent | null {
  if (encounter.friendlyNpcs.length === 0) return null;
  if (prng.next() >= RECRUITMENT_CHANCE) return null;

  const idx = Math.floor(prng.next() * encounter.friendlyNpcs.length);
  const npcId = encounter.friendlyNpcs[idx];
  const npcUnit = unitLookup[npcId];
  if (!npcUnit) return null;

  return { npcId, npcUnit };
}
