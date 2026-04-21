import type { Town, HireableHero } from '../../models/town';
import type { Character } from '../../models/character';

const PARTY_CAP = 8;

export function getHirePool(town: Town): HireableHero[] {
  return town.hirePool;
}

export type HireResult =
  | { character: Character; goldAfter: number }
  | { error: 'party-full' | 'insufficient-gold' };

/**
 * Attempt to hire a hero.
 * Returns the full Character and new gold amount on success,
 * or an { error } object (never throws) on failure.
 */
export function hireCharacter(
  hero: HireableHero,
  party: Character[],
  currentGold: number,
): HireResult {
  if (party.length >= PARTY_CAP) {
    return { error: 'party-full' };
  }
  if (currentGold < hero.hireCost) {
    return { error: 'insufficient-gold' };
  }

  const character: Character = {
    ...hero.characterTemplate,
    id: crypto.randomUUID(),
    recruitmentSource: 'hired',
    actedThisPhase: false,
    deathRecord: null,
  };

  return { character, goldAfter: currentGold - hero.hireCost };
}
