import {
  awardXp,
  applyLevelUp,
  getPromotionOptions,
  applyPromotion,
  onProgressionEvent,
} from './ProgressionService';
import type { Character } from '../../models/character';
import type { ClassDefinition } from '../../models/class';
import type { PRNG } from '../../utils/prng';

export interface ProgressionModule {
  awardXp(character: Character, amount: number): Character;
  applyLevelUp(character: Character, classDef: ClassDefinition, prng: PRNG): Character;
  getPromotionOptions(character: Character, classDef: ClassDefinition, allClassDefs: ClassDefinition[]): ClassDefinition[];
  applyPromotion(character: Character, promotedClassDef: ClassDefinition): Character;
}

export function createProgressionModule(): {
  module: ProgressionModule;
  onEvent: (cb: (event: string, payload: unknown) => void) => void;
} {
  const module: ProgressionModule = {
    awardXp,
    applyLevelUp,
    getPromotionOptions,
    applyPromotion,
  };

  return { module, onEvent: onProgressionEvent };
}
