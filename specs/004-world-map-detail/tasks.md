# Tasks: World Map Terrain Detail

**Input**: Design documents from `/specs/004-world-map-detail/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Included because this feature is covered by the repository's test-driven workflow and the spec includes explicit independent test criteria.

**Organization**: Tasks are grouped by user story so each slice can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared presentation scaffolding for the enlarged, animated world map

- [X] T001 Create shared world-map presentation helpers in `src/modules/world-map/TilePresentation.ts` for the 2x hex size, deterministic phase offsets, and tile frame selection
- [X] T002 Export the new tile-presentation helpers from `src/modules/world-map/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hooks and helper coverage needed before any user story can be implemented safely

**⚠️ CRITICAL**: No user story work should start until the shared helper and test hooks are ready

- [X] T003 [P] Add unit coverage in `tests/unit/world-map/TilePresentation.test.ts` for the 2x-size coordinate math and phase-offset helper
- [X] T004 Add world-map test hooks in `src/game/scenes/WorldMap.ts` so Playwright can read the rendered tile footprint, current tile frame, and party marker position

**Checkpoint**: Shared presentation helpers and inspection hooks are ready; user stories can now be implemented in priority order

---

## Phase 3: User Story 1 - Recognizable Terrain Map (Priority: P1) 🎯 MVP

**Goal**: Render the world map with larger hexes and terrain-specific artwork so the map reads as a real world map instead of a flat blue grid

**Independent Test**: Load the world map and confirm that tiles are visibly terrain-specific, Fog of War is not obscuring the map, and each hex has approximately double its current on-screen footprint

### Tests for User Story 1

- [X] T005 Extend `tests/e2e/smoke.spec.ts` with assertions for terrain-specific tile art, no Fog of War on the world map, the 2x hex footprint, and the automated render-analysis metric

### Implementation for User Story 1

- [X] T006 Update `src/game/scenes/Boot.ts` terrain texture generation so each `TerrainType` has the two tile-art frames needed by the larger map
- [X] T007 Update `src/game/scenes/WorldMap.ts` `renderMap()` to draw terrain-specific art using the doubled hex size instead of flat color fills
- [X] T008 Update `src/game/scenes/WorldMap.ts` hit areas, tile placement math, and map bounds so the 2x hex footprint stays interactive and on-screen
- [X] T009 Update `src/game/scenes/WorldMap.ts` party marker placement so the yellow circle remains centered and readable over the 2x terrain tiles

**Checkpoint**: The world map should now feel legible at a glance, with larger readable hexes and the existing party marker preserved

---

## Phase 4: User Story 2 - Ambient Tile Animation (Priority: P2)

**Goal**: Give visible tiles a short two-step ambient animation with slight per-tile phase offsets, without creating a performance regression

**Independent Test**: Watch the world map for a few seconds and confirm that visible tiles alternate between two states independently, with no synchronized wave across the whole map

### Tests for User Story 2

- [X] T010 [P] Add unit coverage in `tests/unit/world-map/tile-animation.test.ts` for two-state tile animation and deterministic per-tile phase offsets
- [X] T011 [P] Add animation performance assertions to `tests/e2e/perf-frametime.spec.ts` so the animated world map stays within the existing frametime budget

### Implementation for User Story 2

- [X] T012 Implement the tile animation state machine in `src/modules/world-map/TilePresentation.ts` so visible tiles alternate between two states with tile-specific offsets
- [X] T013 Wire the animation update loop into `src/game/scenes/WorldMap.ts` `update()` without per-tile tweens or graphics redraws

**Checkpoint**: The world map should animate subtly and remain performant while keeping the terrain identity readable

---

## Phase 5: User Story 3 - Party Marker Stays Readable (Priority: P3)

**Goal**: Keep the party visible as a yellow circle on top of the terrain art, centered on the occupied hex even after the layout grows

**Independent Test**: Move or inspect the party on the world map and confirm the yellow marker stays centered, above terrain art, and never becomes obscured by the tile presentation

### Tests for User Story 3

- [X] T014 [P] Add unit coverage in `tests/unit/world-map/party-marker.test.ts` for centered placement and overlay depth on 2x tiles
- [X] T015 Extend `tests/e2e/smoke.spec.ts` with assertions that the party marker stays above terrain art and centered on its occupied hex after the 2x size change

### Implementation for User Story 3

- [X] T016 Update `src/game/scenes/WorldMap.ts` party rendering to keep the yellow circle above terrain art and locked to the occupied hex
- [X] T017 Verify `src/game/scenes/WorldMap.ts` test hooks still report the party marker position correctly after the larger-hex layout change

**Checkpoint**: The party marker remains readable and stable over the larger animated world map

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation cleanup across the full feature

- [X] T018 [P] Run targeted validation from `specs/004-world-map-detail/quickstart.md` and fix any failing world-map tests
- [X] T019 Update `specs/004-world-map-detail/quickstart.md` with any notes needed for the 2x hex layout, tile animation checks, and automated render-analysis metric

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
  - User Story 1 delivers the MVP and should be completed first
  - User Story 2 can then layer animation on top of the larger readable map
  - User Story 3 can then lock in party readability over the enlarged animated tiles
- **Polish (Final Phase)**: Depends on the user stories chosen for delivery being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent once Foundational work is complete; establishes the larger hex footprint and terrain art baseline
- **User Story 2 (P2)**: Can start after Foundational work, but is intended to build on the terrain art and tile sizing established by User Story 1
- **User Story 3 (P3)**: Can start after Foundational work and validates the party marker against the enlarged terrain layout

### Within Each User Story

- Tests come first and should fail before implementation begins
- Shared helper work comes before scene wiring
- Scene wiring comes before polish or perf validation
- Each story should be independently demoable before moving to the next one

### Parallel Opportunities

- `T003`, `T010`, and `T014` can run in parallel because they target separate unit test files
- `T006` can proceed alongside `T005` once the shared helper contract is settled, because they touch different files
- `T018` can run after the story phases are complete while documentation is being finalized

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate the larger hexes and terrain-specific tile art before moving on

### Incremental Delivery

1. Deliver the larger readable world map first
2. Add ambient animation while keeping the map performant
3. Preserve the party marker readability over the final presentation

### Parallel Team Strategy

1. One developer can own the shared tile presentation helper and the Boot texture work
2. A second developer can prepare the smoke/perf test updates
3. A third developer can wire the party marker assertions after the larger-hex layout is in place

---

## Notes

- `[P]` tasks should be safe to work on in parallel because they touch different files and do not depend on incomplete tasks
- The larger hex footprint is part of the feature scope and should be validated alongside the terrain art changes
- Keep the party marker yellow circle intact; do not replace it with terrain art or a new icon
