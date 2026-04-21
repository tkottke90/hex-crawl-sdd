# Contract: CombatModule

**Consumers**: GameLoop, CombatScene, UIOverlay

---

## Interface

```typescript
interface CombatModule {
  /** Initialise a new combat encounter from world-map context */
  startEncounter(config: EncounterConfig): CombatEncounter;

  /** Returns the current snapshot of the active encounter; null if none */
  getActiveEncounter(): CombatEncounter | null;

  // --- Player Phase actions (only valid when encounter.phase === 'player') ---
  /** Move a player unit to a target tile; validates reachability */
  moveUnit(characterId: string, target: HexCoord): MoveResult;
  /** Declare an attack action; returns resolved DiceRoll and updated HP */
  attack(attackerId: string, targetId: string): AttackResult;
  /** Mark a unit as having waited; ends its action for this phase */
  wait(characterId: string): void;
  /** End the current Player Phase; transitions to Enemy Phase */
  endPlayerPhase(): void;

  // --- Query ---
  /** Returns valid move destinations for a given unit this phase */
  getMovementRange(characterId: string): HexTile[];
  /** Returns valid attack targets for a given unit from a given position */
  getAttackTargets(characterId: string, fromCoord: HexCoord): string[];
  /** Returns player-controlled unit IDs during Player Phase; empty array during Enemy Phase. Satisfies FR-004b. */
  getPlayerControllableUnits(): string[];
}

interface EncounterConfig {
  playerUnits: string[];        // Character ids
  enemyUnits: EnemyUnit[];
  friendlyNpcs: EnemyUnit[];    // AI-only; for recruitment events
  mapContext: WorldMap;
}

interface MoveResult {
  success: boolean;
  reason?: 'out-of-range' | 'tile-blocked' | 'already-acted';
}

interface AttackResult {
  roll: DiceRoll;
  damageDone: number;
  targetHpAfter: number;
  targetDefeated: boolean;
}
```

---

## Events Emitted

| Event | Payload | When |
|---|---|---|
| `combat:started` | `{ encounter: CombatEncounter }` | New encounter initialised |
| `combat:phase-changed` | `{ phase: CombatPhase, round: number }` | Phase transitions |
| `combat:action` | `{ entry: CombatLogEntry }` | Any unit takes an action |
| `combat:unit-defeated` | `{ unitId: string, isPlayerUnit: boolean }` | Unit reaches 0 HP |
| `combat:resolved` | `{ resolution: CombatResolution }` | Encounter ends |

---

## Constraints

- MUST NOT directly mutate `Character` objects owned by the GameLoop; it emits events and the GameLoop applies state changes.
- Dice rolls MUST be logged in `CombatLogEntry.roll` before HP changes are applied (transparency requirement SC-007).
- MUST NOT reference `SaveModule` or `HexGridModule` internals — receives `WorldMap` as config input only.
- During the Enemy Phase, AI actions are resolved internally and events are emitted per action; consumers observe via events.
- MUST NOT allow `attack()` or `moveUnit()` calls during Enemy Phase; return `{ success: false, reason: 'wrong-phase' }`.
