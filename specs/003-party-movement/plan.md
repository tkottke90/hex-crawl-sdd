# Implementation Plan: Unified Party Movement (003-party-movement)

Goal: Implement unified party movement with a per-turn tile budget, hover preview, death markers persisted to saves, and UI for remaining budget.

Constitution Check

- Principle I, Simple & Playable First: This plan keeps the feature scoped to world-map movement, death markers, and turn-budget UI, and preserves a playable loop at every milestone.
- Principle II, Test-Driven Development: The task order starts with unit tests for budget math and helper modules before moving into world-map integration work.
- Principle III, Component/Module Separation: Movement budget, death-marker persistence, and world-map rendering are separated into focused helpers instead of being folded into one monolithic scene change.
- Principle IV, Composability & Reusability: `TurnBudgetManager` and `DeathMarkerStore` are reusable modules with narrow APIs, making the feature easier to extend or replace without rewriting the core loop.

Milestones

1. Design & Data Model (this step)
   - Finalise save schema additions (`deathMarkers: {coord, name}[]`) and world-map state (`remainingTurnBudget`).
   - Confirm where to surface "End Turn" (simple button + keyboard shortcut) — planning decision.

2. Core Movement Engine
   - Replace single-character move flow in `WorldMap.ts` with party-move flow.
   - Use A* from `HexCoordUtils` to compute single path, truncate to remaining budget, apply to all members.
   - Decrement `remainingTurnBudget` by tiles traversed; hide reachable highlights when budget == 0.

3. UX & Visuals
   - Tile highlight overlay (in-range based on remaining budget).
   - Hover A* preview with yellow (in-range) / red (out-of-range) split; throttle per-tile entry.
   - Death marker visuals (small icon + name label) and rendering from save on load.
   - Remaining budget UI (numeric/pips) and optional "End Turn" control.

4. Persistence & Migration
   - Extend save schema to serialise `deathMarkers: { coord, name }[]` and world-map `remainingTurnBudget` (or recompute on load if preferred).
   - Add legacy repair: on load, move non-PC occupants to PC tile if mismatched.

5. Testing & QA
   - Unit tests for movement-range calculation (DEX modifiers), path truncation, death-marker serialisation.
   - Integration tests: world-map flows (save/load, legacy save repair, death handling).
   - e2e smoke test: party moves together; death markers persist after save/load; turn budget refresh on turn boundary.

Deliverables
- `specs/003-party-movement/data-model.md`
- `specs/003-party-movement/tasks.md`
- `src/game/scenes/WorldMap.ts` changes + small helpers (`TurnBudgetManager`, `DeathMarkerStore`)
- Tests under `tests/unit/` and `tests/e2e/`

Risks
- UI tuning for budget visibility (playtesting required).
- Save migration complexity for many legacy saves (mitigate by conservative repair to PC tile).

Next: create `data-model.md` and `tasks.md` (TDD-ordered) and then we can start implementing core movement changes.