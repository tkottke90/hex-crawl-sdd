import type { Character } from '../../models/character';
import type { ClassDefinition } from '../../models/class';
import type { PRNG } from '../../utils/prng';
import type { Attributes } from '../../models/attributes';

type ProgressionEventCallback = (event: string, payload: unknown) => void;

const listeners: ProgressionEventCallback[] = [];

function emit(event: string, payload: unknown): void {
  for (const cb of listeners) cb(event, payload);
}

/**
 * Award XP to a character. Returns an updated character.
 * Does NOT emit the levelUp event — caller should check returned level.
 * Level is incremented when xp >= xpToNextLevel; overflow xp is carried.
 */
export function awardXp(character: Character, amount: number): Character {
  const newXp = character.xp + amount;
  if (newXp >= character.xpToNextLevel) {
    const overflow = newXp - character.xpToNextLevel;
    const newLevel = character.level + 1;
    const updated: Character = {
      ...character,
      xp: overflow,
      level: newLevel,
      xpToNextLevel: newLevel * 100,
    };
    emit('character:levelUp', {
      characterId: character.id,
      newLevel,
      statDeltas: {},
    });
    return updated;
  }
  return { ...character, xp: newXp };
}

/**
 * Apply one level-up to a character using class growth rates.
 * Returns updated character. Does NOT mutate input.
 */
export function applyLevelUp(character: Character, classDef: ClassDefinition, prng: PRNG): Character {
  const attrs = character.attributes;
  const deltas: Partial<Attributes> = {};

  const statKeys: (keyof Attributes)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const newAttrs = { ...attrs };

  for (const stat of statKeys) {
    const rate = classDef.growthRates[stat] ?? 0;
    if (prng.next() < rate) {
      newAttrs[stat] = attrs[stat] + 1;
      deltas[stat] = 1;
    }
  }

  const newCon = newAttrs.con;
  const conMod = Math.floor((newCon - 10) / 2);
  const newLevel = character.level + 1;
  const newMaxHp = classDef.maxHpBase + conMod * newLevel;

  emit('character:levelUp', {
    characterId: character.id,
    newLevel,
    statDeltas: deltas,
  });

  return {
    ...character,
    level: newLevel,
    maxHp: Math.max(1, newMaxHp),
    attributes: newAttrs,
  };
}

/**
 * Returns promotion options for a character if they are at their class's promotionLevel.
 */
export function getPromotionOptions(
  character: Character,
  classDef: ClassDefinition,
  allClassDefs: ClassDefinition[],
): ClassDefinition[] {
  if (classDef.promotionLevel === null) return [];
  if (character.level < classDef.promotionLevel) return [];
  return allClassDefs.filter((c) => classDef.promotionPaths.includes(c.id));
}

/**
 * Apply a promotion. Returns updated character with new classId, level=1, xp=0,
 * additive base stat bonuses, and full HP.
 */
export function applyPromotion(character: Character, promotedClassDef: ClassDefinition): Character {
  const newAttrs = { ...character.attributes };
  const statKeys: (keyof Attributes)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  for (const stat of statKeys) {
    newAttrs[stat] = character.attributes[stat] + (promotedClassDef.baseStats[stat] ?? 0);
  }

  const conMod = Math.floor((newAttrs.con - 10) / 2);
  const newMaxHp = Math.max(1, promotedClassDef.maxHpBase + conMod);

  emit('character:promoted', {
    characterId: character.id,
    newClassId: promotedClassDef.id,
  });

  return {
    ...character,
    classId: promotedClassDef.id,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    attributes: newAttrs,
    maxHp: newMaxHp,
    hp: newMaxHp,
  };
}

/** Register a listener for progression events (character:levelUp, character:promoted). */
export function onProgressionEvent(cb: ProgressionEventCallback): void {
  listeners.push(cb);
}
