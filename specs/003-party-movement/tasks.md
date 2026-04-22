# Tasks: Unified Party Movement

**Input**: Design docs from `/specs/003-party-movement/`
**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`
**Tests**: Included because the feature plan uses TDD and the spec defines independent test criteria for each story.

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [P] Create the shared world-map helper module surface in `src/modules/world-map/index.ts` for movement, budget, and death-marker helpers.
- [ ] T002 [P] Add the remaining-budget HUD component scaffold in `src/game/ui/TurnBudgetLabel.ts` and reserve a mount point in `src/game/scenes/WorldMap.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Write the shared failing tests that define the new movement, save, and marker behavior before implementation starts.

- [ ] T003 [P] Add unit coverage for turn-budget math in `tests/unit/world-map/TurnBudgetManager.test.ts`.
- [ ] T004 [P] Add unit coverage for death-marker storage in `tests/unit/world-map/DeathMarkerStore.test.ts`.
- [ ] T005 [P] Add save schema and migration regression coverage for `deathMarkers` and `remainingTurnBudget` in `tests/unit/save/serialise.test.ts` and `tests/unit/save/migration.test.ts`.
- [ ] T006 [P] Add path truncation, zero-path, and shared-destination side-effect coverage in `tests/unit/hex-grid/pathfinding.test.ts` and `tests/unit/world-map/party-movement.test.ts`.

**Checkpoint**: The shared behavior is now specified by tests and ready for implementation.

---

## Phase 3: User Story 1 - Move Whole Party with One Click (Priority: P1)

**Goal**: A single tile click moves the whole party together and consumes the turn budget once.

**Independent Test**: Click a reachable tile and confirm every party member lands on the same destination tile while the remaining budget decreases exactly once.

- [ ] T007 [P] [US1] Implement `TurnBudgetManager` in `src/modules/world-map/TurnBudgetManager.ts` with reset, consume, and getRemaining behavior.
- [ ] T008 [P] [US1] Implement party path planning and truncation in `src/modules/world-map/PartyMovementPlanner.ts`.
- [ ] T009 [US1] Update `src/game/scenes/WorldMap.ts` to move the full party on a single click, apply truncated paths to every member, consume the turn budget once per move, and trigger tile exploration plus POI interactions from the shared destination only.
- [ ] T010 [US1] Add remaining-budget tile highlights and hover preview rendering in `src/game/scenes/WorldMap.ts` and `src/modules/hex-grid/ReachableTiles.ts`.
- [ ] T011 [US1] Add the required End Turn button and keyboard shortcut in `src/game/scenes/WorldMap.ts` and `src/game/ui/TurnBudgetLabel.ts`, and hook turn-boundary refresh events so the remaining budget resets after combat or town returns.

**Checkpoint**: The unified party movement loop is playable on its own.

---

## Phase 4: User Story 2 - Select Character for Stat Display and Camera Focus (Priority: P2)

**Goal**: Selecting a character updates the stat panel and camera without changing movement ownership.

**Independent Test**: Tap the Ward, verify the stat panel and camera update, then click a destination tile and confirm the whole party still moves together.

- [ ] T012 [P] [US2] Add regression coverage for sprite selection, stat-panel updates, and camera focus in `tests/unit/camera/CameraController.test.ts` and `tests/e2e/camera.spec.ts`.
- [ ] T013 [US2] Preserve `selectChar()` behavior in `src/game/scenes/WorldMap.ts` so selection only affects the stat panel and camera follow state.

**Checkpoint**: Character selection remains useful without affecting party movement.

---

## Phase 5: User Story 4 - Character Death Removes Them from Party (Priority: P2)

**Goal**: Non-PC deaths remove the character from the active party, leave a persistent marker, and recalculate movement without their DEX contribution.

**Independent Test**: Kill a non-PC character in combat, return to the world map, and confirm the sprite is gone, a name marker remains, and the turn budget updates.

- [ ] T014 [P] [US4] Implement `DeathMarkerStore` in `src/modules/world-map/DeathMarkerStore.ts` with add, get, serialise, and load support.
- [ ] T015 [US4] Update `src/game/scenes/WorldMap.ts` to remove dead non-PC characters from the active party, remove their sprites, and recalculate the turn budget.
- [ ] T016 [US4] Render death markers from runtime state in `src/game/scenes/WorldMap.ts` using `DeathMarkerStore` data so markers stay visible after the death event.
- [ ] T017 [P] [US4] Add death-handling coverage in `tests/unit/world-map/DeathMarkerStore.test.ts` and `tests/unit/world-map/death-handling.test.ts`.

**Checkpoint**: Death handling no longer leaves ghost party members on the world map.

---

## Phase 6: User Story 3 - Party Stays Together After Save/Restore (Priority: P3)

**Goal**: Saves restore the shared tile, remaining budget, and death markers exactly as the player left them.

**Independent Test**: Move the party, save mid-turn, reload, and verify shared position, remaining budget, and markers all match the pre-save state.

- [ ] T018 [P] [US3] Extend `src/models/save.ts`, `src/schemas/save.schema.ts`, and `src/modules/save/Serialiser.ts` to persist `deathMarkers` and `remainingTurnBudget`.
- [ ] T019 [US3] Update `src/modules/save/Migrator.ts` and `src/game/scenes/WorldMap.ts` to restore `deathMarkers`, `remainingTurnBudget`, and legacy occupant repairs before the first player action.
- [ ] T020 [P] [US3] Add save/load round-trip coverage for shared-party restore, mid-turn budget persistence, death-marker render timing within one frame, and legacy repair in `tests/unit/save/serialise.test.ts`, `tests/unit/save/migration.test.ts`, and `tests/e2e/new-game.spec.ts`.

**Checkpoint**: Save/restore preserves the exact world-map state, including mid-turn progress.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Tighten the feature across UI, persistence, and smoke coverage.

- [ ] T021 [P] Tighten hover-preview throttling and budget display polish in `src/game/scenes/WorldMap.ts` and `src/game/ui/TurnBudgetLabel.ts`.
- [ ] T022 [P] Expand `tests/e2e/smoke.spec.ts` to cover party movement, death markers, and mid-turn save/load persistence.
- [ ] T023 Run `scripts/validate-quickstart.sh` after the feature stories are complete and record any follow-up gaps.

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) has no dependencies and can start immediately.
- Foundational (Phase 2) depends on Setup and blocks all user story implementation.
- User Stories (Phase 3+) depend on the Foundational phase being complete.
- Polish (Phase 7) depends on the desired user stories being complete.

### User Story Dependencies

- US1 is the MVP slice and does not depend on the other stories.
- US2 can start after the foundational helpers exist and remains independent of save/restore.
- US4 should land before US3 because save/restore must persist the death markers it creates.
- US3 depends on the movement and death-marker state already existing.

### Within Each User Story

- Tests are written before implementation and should fail first.
- Helper modules come before scene integration.
- Scene wiring comes before polish and smoke coverage.

### Parallel Opportunities

- `T001` and `T002` can run in parallel because they touch different files.
- `T003` through `T006` can run in parallel because they are independent test files.
- `T007` and `T008` can run in parallel if kept isolated in separate helper modules.
- `T012` can run in parallel with the movement or save stories because it only covers the selection path.
- `T014` and `T017` can run in parallel because the implementation and test work are split across different files.

### Parallel Example: User Story 1

- `T007` Implement `TurnBudgetManager` in `src/modules/world-map/TurnBudgetManager.ts`
- `T008` Implement party path planning and truncation in `src/modules/world-map/PartyMovementPlanner.ts`

### Parallel Example: User Story 3

- `T018` Extend `src/models/save.ts`, `src/schemas/save.schema.ts`, and `src/modules/save/Serialiser.ts`
- `T020` Add save/load round-trip coverage in `tests/unit/save/serialise.test.ts`, `tests/unit/save/migration.test.ts`, and `tests/e2e/new-game.spec.ts`

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational phases.
2. Deliver US1 so the party moves together with a working turn budget.
3. Validate that the game is still playable before touching the remaining stories.

### Incremental Delivery

1. Add selection and camera retention in US2.
2. Add death handling and persistent markers in US4.
3. Finish with save/restore and legacy repair in US3.

### Validation Order

1. Run the new unit tests for budget math, markers, and path truncation.
2. Run the story-focused integration and e2e tests.
3. Finish with the smoke and quickstart validation tasks.
