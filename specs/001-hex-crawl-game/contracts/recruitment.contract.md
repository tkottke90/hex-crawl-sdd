# Contract: RecruitmentModule

**Consumers**: WorldMapScene, CombatModule (event subscriber), GameLoop

---

## Interface

```typescript
interface RecruitmentModule {
  // --- Town hiring ---
  /** Returns available heroes for hire at a town */
  getHirePool(townId: string): HireableHero[];
  /** Hire a hero; deducts cost and adds to party */
  hireHero(townId: string, heroIndex: number, partyRoster: Character[]): HireResult;

  // --- Rare encounter recruitment ---
  /**
   * Rolls for a rare recruitment encounter trigger (<10% probability).
   * Returns a RecruitmentEvent if triggered, null otherwise.
   */
  rollRecruitmentEncounter(
    currentCoord: HexCoord,
    partySize: number,
    partyMaxSize: number
  ): RecruitmentEvent | null;

  /** Resolve recruitment offer after combat; updates event status */
  resolveRecruitmentOffer(
    event: RecruitmentEvent, 
    combatResolution: CombatResolution,
    partyRoster: Character[]
  ): RecruitmentResult;
}

interface HireResult {
  success: boolean;
  character?: Character;
  reason?: 'party-full' | 'insufficient-gold' | 'hero-not-available';
}

interface RecruitmentResult {
  status: RecruitmentEventStatus;
  character?: Character;   // present only when status === 'accepted'
}
```

---

## Events Emitted

| Event | Payload | When |
|---|---|---|
| `recruitment:encounter-triggered` | `{ event: RecruitmentEvent }` | Rare encounter roll succeeds |
| `recruitment:hired` | `{ character: Character, townId: string }` | Hero hired from town |
| `recruitment:resolved` | `{ event: RecruitmentEvent, result: RecruitmentResult }` | Post-combat offer resolved |

---

## Constraints

- `rollRecruitmentEncounter` MUST return `null` immediately if `partySize >= partyMaxSize` (no trigger when party is full).
- The NPC in a recruitment encounter MUST be added to `CombatEncounter.friendlyNpcs` and MUST NOT appear in `playerUnits` — the `CombatModule` contract enforces this.
- `hireHero` MUST return `{ success: false, reason: 'party-full' }` when `partyRoster.length >= 8`.
- MUST NOT reference `SaveModule` internals.
