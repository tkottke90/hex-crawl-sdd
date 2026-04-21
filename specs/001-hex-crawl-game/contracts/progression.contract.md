# Contract: ProgressionModule

**Consumers**: CombatScene (post-combat XP award), StatPanel (stat change events)

---

## Interface

```typescript
interface ProgressionModule {
  /** Award XP to a character; returns updated character. Fires `character:levelUp` event if threshold crossed. */
  awardXp(character: Character, amount: number): Character;

  /** Apply a level-up to a character using their class growth rates. Returns updated character with new stats and maxHp. */
  applyLevelUp(character: Character, classDef: ClassDefinition): Character;

  /** Returns the promoted ClassDefinition options available to a character at their promotionLevel. Empty array if not eligible. */
  getPromotionOptions(character: Character, classDefs: ClassDefinition[]): ClassDefinition[];

  /** Apply a class promotion. Returns updated character with new classId, level reset to 1, xp 0, base stat bonuses applied. */
  applyPromotion(character: Character, promotedClassDef: ClassDefinition): Character;
}
```

---

## Events Emitted

| Event | Payload | When |
|---|---|---|
| `character:levelUp` | `{ characterId: string, newLevel: number, statDeltas: Partial<Attributes> }` | `awardXp` crosses XP threshold |
| `character:promoted` | `{ characterId: string, newClassId: string }` | `applyPromotion` completes |

---

## Constraints

- MUST NOT import from `CombatModule`, `HexGridModule`, `SaveModule`, or `RecruitmentModule`.
- All methods MUST be pure functions — they accept and return value objects; no internal mutable state.
- `applyLevelUp` MUST use the caller-supplied `PRNG` via `character` context or a passed seed; it MUST NOT call `Math.random()`.
- `getPromotionOptions` MUST return an empty array (not throw) when `character.level < classDef.promotionLevel`.
