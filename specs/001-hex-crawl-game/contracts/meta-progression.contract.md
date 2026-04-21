# Contract: MetaProgressionModule (v1 Stub)

**Consumers**: SaveModule, GameLoop

**Status**: v1 stub — no active data or behaviour. Extension point reserved per Constitution Principle IV.

---

## Interface (v1)

```typescript
interface MetaProgressionModule {
  /** Return the current (empty in v1) meta-progression record */
  getRecord(): MetaProgressionRecord;
  /** Called by GameLoop at run-end; no-op in v1 */
  onRunCompleted(outcome: RunOutcome): void;
  /** Called by GameLoop at run-start; no-op in v1 */
  onRunStarted(): void;
}

interface MetaProgressionRecord {
  schemaVersion: 1;
  // Future fields added here without changing the SaveState root shape:
  // unlockedClasses?: string[];
  // loreEntries?: string[];
  // completedRuns?: RunSummary[];
}

interface RunOutcome {
  mode: GameModeType;
  success: boolean;
  roundsPlayed: number;
}
```

---

## Extension Points

When meta-progression is implemented in a future version:
1. Bump `schemaVersion` to `2`.
2. Add fields to `MetaProgressionRecord`.
3. Implement `onRunCompleted` and `onRunStarted` with real logic.
4. Add a migration entry in `SaveModule`'s migration table for `version N → N+1`.

**No other modules need to change** — they interact only through this contract interface.

---

## Constraints

- In v1, `getRecord()` MUST return `{ schemaVersion: 1 }` with no additional fields.
- `onRunCompleted()` and `onRunStarted()` MUST be no-ops in v1 (do not throw).
- MUST NOT reference `CombatModule`, `HexGridModule`, or `RecruitmentModule` internals.
