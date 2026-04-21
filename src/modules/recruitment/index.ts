import type { Town, HireableHero } from '../../models/town';
import type { Character } from '../../models/character';
import { getHirePool, hireCharacter, type HireResult } from './TownService';
import { rollRecruitmentEncounter, type RecruitmentEvent } from './EncounterTrigger';
import { takeTurn } from './FriendlyNpcAi';

export interface RecruitmentModule {
  getHirePool(town: Town): HireableHero[];
  hireCharacter(hero: HireableHero, party: Character[], gold: number): HireResult;
}

export function createRecruitmentModule(): { module: RecruitmentModule } {
  const module: RecruitmentModule = {
    getHirePool,
    hireCharacter,
  };
  return { module };
}

export { getHirePool, hireCharacter, rollRecruitmentEncounter, takeTurn };
export type { HireResult, RecruitmentEvent };
