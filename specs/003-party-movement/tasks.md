# Tasks (TDD-ordered) — Unified Party Movement

1. T1 — Movement Range Calculation (unit)
   - Test `dexModifier(stat)` mapping and `computeTurnBudget(party)` returns `Math.max(MIN_PARTY_MOVE_RANGE, 1 + sum(dexMod))`.

2. T2 — Death Marker Store (unit)
   - Implement `DeathMarkerStore` with `add`, `get`, `serialise`, `load`. Test serialisation matches save schema.

3. T3 — TurnBudgetManager (unit)
   - Implement `resetBudget`, `consume`, `getRemaining` and unit tests for edge cases (consume beyond 0, reset after roster change).

4. T4 — WorldMap Movement Core (integration)
   - Update `WorldMap.onTileClick()` to compute single A* path, truncate to remaining budget, call `moveOccupant` for each active member in a loop, decrement budget, and emit a single `exploration` event.
   - Tests: simulate party on map, click far tile with obstacles, assert truncation and budget decrement.

5. T5 — Hover Preview (integration)
   - Implement per-tile-entry throttle, render yellow/red split preview, and hide preview for impassable/no-path.
   - Test: pointer movement within same tile does not trigger recompute.

6. T6 — Death Handling (integration)
   - On character death (non-PC): remove from roster, remove sprite, add death marker via `DeathMarkerStore`, recalc budget.
   - Test: after death, budget updates and marker appears in `DeathMarkerStore`.

7. T7 — Save/Load (integration)
   - Serialise `deathMarkers` to save file and load them on world-map initialisation. Implement legacy repair for occupants on different tiles.
   - Test: save+load round-trip preserves markers; legacy save repair moves non-PC to PC tile.

8. T8 — UI (manual + automated)
   - Add remaining budget display, integrate overlay to show reachable tiles based on remaining budget.
   - Add optional End Turn button (hook into FR-016). Manual QA required.

9. T9 — FR-003 regression guard
   - Add a regression test that tapping a character sprite still updates the active stat display and camera focus, and does not alter movement ownership.

10. T10 — e2e smoke
   - New-game: move party, save, reload, assert markers and positions; simulate non-PC death and ensure marker persists.

11. T11 — Performance
   - Profile hover preview frequency and ensure per-tile throttle prevents excessive A* calls.

Notes
- Keep changes small and test-driven. Prefer adding helper modules (`DeathMarkerStore`, `TurnBudgetManager`) rather than bloating `WorldMap.ts`.
- After implementation, open PR and run unit + e2e suites.  
