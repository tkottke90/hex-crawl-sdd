# Tasks: Random Map Generation

**Input**: Design documents from `/specs/005-random-map-generation/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/map-generator.contract.md`
**Tests**: Included — the project constitution mandates TDD (Red-Green-Refactor) for all production code.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- All tasks include exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a known-green baseline before any production or test code is modified.

- [X] T001 Verify all existing tests pass

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: The seed format change is the cornerstone for every subsequent story — without a unique seed on each run, none of the US1–US3 story tests can prove the feature is working.

**⚠️ CRITICAL**: This change must land before US1–US3 test files are written, because the tests assert behavior of maps generated from the new seed format.

- [X] T002 Update seed generation in `src/game/scenes/WorldMap.ts`

**Checkpoint**: New games now produce a unique seed on every call; restore path is unaffected.

---

## Phase 3: User Story 1 - New Game Produces a Unique Map (Priority: P1) 🎯 MVP

**Goal**: Every new game run is seeded differently so no two consecutive games produce the same inner terrain layout; the same seed always reconstructs the identical map.

**Independent Test**: Generate two maps with distinct base-36 seeds and confirm their tile layouts differ; generate the same seed twice and confirm byte-identical output.

### Tests for User Story 1

> **Write these tests FIRST — they must FAIL before any implementation begins (Red phase)**

- [X] T003 [P] [US1] Extend `tests/unit/hex-grid/map-gen.test.ts`

  > **SC-001 note**: SC-001 references "10 consecutive games" as a sample size for manual verification; 2 programmatic seeds is sufficient to prove the uniqueness and determinism *properties* in a unit test context.

### Implementation for User Story 1

*No new production code required beyond T002 — `generateMap` is already deterministic and different seeds already produce different maps. T003 tests will go green once T002 is in place.*

**Checkpoint**: User Story 1 is fully functional and testable. Two consecutive new games produce different maps; loading a save restores the original layout.

---

## Phase 4: User Story 2 - Map Is Always Bounded by Water (Priority: P2)

**Goal**: The outer two tile-layers of every generated map are always ocean and always impassable, regardless of what the noise function would have assigned to those coordinates.

**Independent Test**: Generate any map and assert that every tile where `r < 2`, `r >= height-2`, `qi < 2`, or `qi >= width-2` has `terrain === 'ocean'` and `passable === false`.

### Tests for User Story 2

> **Write these tests FIRST — they must FAIL before T005–T006 are implemented (Red phase)**

- [X] T004 [P] [US2] Write failing tests in `tests/unit/hex-grid/map-gen.test.ts`

### Implementation for User Story 2

- [X] T005 [US2] Add `isBorderTile` helper in `src/modules/hex-grid/MapGenerator.ts`
- [X] T006 [US2] Add border post-processing pass in `src/modules/hex-grid/MapGenerator.ts`

**Checkpoint**: User Story 2 is independently complete. Any generated map has a guaranteed water border.

> **C2 movement note**: US2 scenario 2 requires the party CANNOT move onto border tiles. The `passable: false` flag set by T006 is enforced by the existing movement system (which rejects impassable tiles). No new movement code is needed — verify this by confirming the `party-movement` module's existing "impassable tile rejected" tests still pass after T006.

---

## Phase 5: User Story 3 - Player Always Starts in the Bottom-Center Region (Priority: P2)

**Goal**: `playerStartCoord` always lands in the bottom half of the map height and the center horizontal half of the map width, is always passable, and uses a closest-to-center-bottom heuristic to feel natural.

**Independent Test**: Generate maps across five different seeds and assert that `playerStartCoord` satisfies `coord.r >= Math.floor(height / 2)` and `qi` is in `[Math.floor(width/4), width - Math.floor(width/4))` for all of them, and that the start tile is passable.

### Tests for User Story 3

> **Write these tests FIRST — they must FAIL before T008–T009 are implemented (Red phase)**

- [X] T007 [P] [US3] Write failing tests in `tests/unit/hex-grid/map-gen.test.ts` (start region)

### Implementation for User Story 3

- [X] T008 [US3] Add `isInStartRegion` helper in `src/modules/hex-grid/MapGenerator.ts`
- [X] T009 [US3] Replace first-passable-tile scan with start-region candidate selection in `src/modules/hex-grid/MapGenerator.ts`

  > **C1 camera note**: `initCamera()` in `WorldMap.ts` reads `worldMapData.playerStartCoord` for initial camera position. Confirm as part of US3 acceptance that the camera correctly centers on the new start coord — add a manual or smoke check if not already covered by `camera.spec.ts`.

**Checkpoint**: User Story 3 is independently complete. Every new game starts the party in the correct map region.

---

## Phase 6: User Story 4 - Seed Is Visible on the World Map (Priority: P3)

**Goal**: A card-style HUD element sits in the top-right corner showing both the game mode pill and the run seed, styled consistently with `StatPanel`, replacing the existing `ModeLabel` pill.

**Independent Test**: Start a new game and verify `#seed-info-card` is in the DOM, contains the seed text, and disappears after `destroy()` is called.

### Tests for User Story 4

> **Write these tests FIRST — they must FAIL before T012–T013 are implemented (Red phase)**

- [X] T010 [P] [US4] Write failing unit tests in `tests/unit/world-map/seed-info-card.test.ts`
- [X] T011 [P] [US4] Add `#seed-info-card` visibility assertion to `tests/e2e/smoke.spec.ts`

### Implementation for User Story 4

- [X] T012 [P] [US4] Create `src/game/ui/SeedInfoCard.ts`
- [X] T013 [US4] Update `src/game/scenes/WorldMap.ts`: replace `ModeLabel` with `SeedInfoCard`

**Checkpoint**: User Story 4 is complete. The seed card is visible on the world map for both new games and loaded saves. The game mode pill is preserved in the new card.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Confirm the complete feature is stable, all acceptance criteria pass, and no regressions were introduced.

- [X] T014 [P] Run the full test suite (`npm test`) — all 179 tests pass, 0 failures

---

## Dependency Graph

```
T001 (baseline green)
  └─ T002 (seed format — foundational)
       ├─ T003 [US1 tests] → no new impl needed (T002 closes US1)
       ├─ T004 [US2 tests] → T005 → T006
       ├─ T007 [US3 tests] → T008 → T009 (must run after T006 for border-then-start ordering)
       └─ T010 [US4 tests]
          T011 [US4 e2e test]
          T012 [SeedInfoCard.ts]
               └─ T013 [WorldMap.ts integration]
                    └─ T014 (full test run)
```

## Parallel Execution Opportunities

| Story | Parallelizable tasks |
|-------|---------------------|
| US1 | T003 can be written in parallel with US2/US3 test writing |
| US2 | T004 (test) is parallelizable with other story tests in other phases |
| US3 | T007 (test) is parallelizable with other story tests in other phases |
| US4 | T010, T011, T012 can all be written/created in parallel (different files) |

Note: US2 (T005–T006) and US3 (T008–T009) both modify `src/modules/hex-grid/MapGenerator.ts` — implement US2 fully before starting US3 to avoid merge conflicts on the same file.

## Implementation Strategy

**MVP scope**: Phases 1–5 (T001–T009) deliver the core gameplay value — unique, bordered maps with correct start placement. This is immediately shippable and playable.

**Incremental delivery**:
1. Phases 1–3: Unique seeds and deterministic reconstruction (T001–T003)
2. Phase 4: Water border guarantee (T004–T006)
3. Phase 5: Correct start placement (T007–T009)
4. Phase 6: Seed visibility HUD (T010–T013)
5. Final: Full test run (T014)
