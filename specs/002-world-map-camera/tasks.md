# Tasks: World Map Camera Behavior

**Input**: Design documents from `specs/002-world-map-camera/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅  
**Branch**: `002-world-map-camera`  
**Tests**: Included — Constitution Principle II (TDD) is NON-NEGOTIABLE. Tests are written before implementation in every phase.

## Format: `- [ ] [ID] [P?] [Story?] Description — file path`

- **[P]**: Parallelizable (different files, no incomplete dependencies)
- **[Story]**: User story label (US1/US2/US3) — present for Phase 3+ tasks only
- Checkbox start (`- [ ]`) is mandatory on every task

---

## Phase 1: Setup

**Purpose**: Create the `camera` module skeleton with type definitions and constants. No logic yet — establishes the file structure all subsequent tasks build on.

- [ ] T001 Create `src/modules/camera/CameraController.ts` with `CameraMode`, `CameraState`, `CameraBounds` type definitions and all constants from `data-model.md` (`TILE_SIZE`, `PAN_SPEED`, `CAM_BOUND_PADDING`, `TWEEN_DURATION_PER_TILE`, `TWEEN_MAX_DURATION`, `TWEEN_EASE`) — no method bodies yet — `src/modules/camera/CameraController.ts`
- [ ] T002 [P] Create `src/modules/camera/index.ts` exporting `CameraController`, `CameraControllerOptions`, `CameraKeys` — `src/modules/camera/index.ts`
- [ ] T003 [P] Create `tests/unit/camera/CameraController.test.ts` skeleton with `describe` blocks for `setBounds`, `centerOn`, `followTo`, `reCenterOn`, `update`, and `isFreePanActive` — `tests/unit/camera/CameraController.test.ts`
- [ ] T004 [P] Create `tests/e2e/camera.spec.ts` with story-level `describe` blocks for US1 (centering at load), US2 (follow tween), and US3 (manual pan + re-center button) — `tests/e2e/camera.spec.ts`

---

## Phase 2: Foundational — Coordinate Refactor (Blocking)

**Purpose**: Remove the `offsetX/offsetY` viewport hack from `WorldMap.ts` so tiles and sprites render at raw `toPixel()` world coordinates. **This is the highest-risk change in the feature.** It must be committed atomically and all existing tests must pass before any camera logic is added.

**⚠️ CRITICAL**: No user story work can begin until T005–T007 are complete and green.

- [ ] T005 Remove `offsetX` / `offsetY` addition (`this.scale.width / 2`, `this.scale.height / 2`) from every tile draw call and interactive hit-area setup inside `renderMap()` — tiles now render at raw `toPixel()` coordinates — `src/game/scenes/WorldMap.ts`
- [ ] T006 Remove `offsetX` / `offsetY` addition from every sprite position assignment inside `renderParty()` and the matching position in the existing character sprite tween in `onTileClick()` — `src/game/scenes/WorldMap.ts`
- [ ] T007 Run full existing test suite (`vitest run` + `playwright test`) and confirm all tests pass as the green baseline before adding any camera code — rollback T005–T006 if `smoke.spec.ts` or any `tests/unit/hex-grid/` tests fail

**Checkpoint**: Coordinate system is corrected — all subsequent tasks may now proceed in user-story order.

---

## Phase 3: User Story 1 — Camera Centers on Player at Load (Priority: P1) 🎯 MVP

**Goal**: The camera is centered on the active character's tile on the first interactive frame after world map load (new game and resume-save paths). No manual scroll required.

**Independent Test**: Load a new game, take no input, and assert the active character sprite is within 2 px of the viewport centre. Repeat with a loaded save.

### Tests for User Story 1 ⚠️ Write these FIRST — they must FAIL before T011–T013

- [ ] T008 [US1] Write failing unit test: `setBounds(tiles)` calls `camera.setBounds()` with the correct min/max world-space rect derived from all tile centres plus `CAM_BOUND_PADDING` — `tests/unit/camera/CameraController.test.ts`
- [ ] T009 [P] [US1] Write failing unit test: `centerOn(x, y)` calls `camera.centerOn(x, y)` and does not call `camera.pan()` — `tests/unit/camera/CameraController.test.ts`
- [ ] T010 [P] [US1] Write failing e2e test: after a new game loads, the active character's hex tile centre is within 2 px of the Phaser camera's world centre (`camera.midPoint`) — `tests/e2e/camera.spec.ts`
- [ ] T011 [P] [US1] Write failing e2e test: after resuming a saved game, the camera world centre matches the active character's saved tile position, not the map origin `(0, 0)` — `tests/e2e/camera.spec.ts`

### Implementation for User Story 1

- [ ] T012 [US1] Implement `CameraController.setBounds(tiles: HexTile[])`: compute bounding box from `toPixel()` results, add `CAM_BOUND_PADDING`, call `camera.setBounds()` — `src/modules/camera/CameraController.ts`
- [ ] T013 [US1] Implement `CameraController.centerOn(x: number, y: number)`: call `camera.centerOn(x, y)` with no tween — `src/modules/camera/CameraController.ts`
- [ ] T014 [US1] Construct `CameraController` in `WorldMap.create()` after `renderMap()`; call `setBounds(tiles)`; after `buildParty()` / `restoreFromSave()` confirm `selectedChar` is non-null then call `centerOn(tileWorldPos(activeCharCoord))` — `src/game/scenes/WorldMap.ts`

**Checkpoint**: US1 complete. New game and loaded save both open with active character centred. All T008–T011 tests now pass.

---

## Phase 4: User Story 2 — Camera Follows Active Character (Priority: P2)

**Goal**: When the active character moves to a new tile the camera performs an ease-out tween to keep them centred. Tweens in flight are interrupted and redirected on each new move. When the active character switches (turn change), the camera pans to the new character.

**Independent Test**: Move the active character three consecutive tiles, confirm each destination tile centre is reached by the camera within 150 ms per tile (≤ 600 ms capped). Confirm no snap/jump.

### Tests for User Story 2 ⚠️ Write these FIRST — they must FAIL before T019–T020

- [ ] T015 [US2] Write failing unit test: `followTo(coord, 1)` calls `camera.pan(x, y, 150, 'Quad.easeOut')` where `x, y` are the world-space centre of `coord` — `tests/unit/camera/CameraController.test.ts`
- [ ] T016 [P] [US2] Write failing unit test: `followTo(coord, 4)` caps duration at 600 ms (`Math.min(150 * 4, 600) === 600`) — `tests/unit/camera/CameraController.test.ts`
- [ ] T017 [P] [US2] Write failing unit test: calling `followTo()` while a tween is in progress calls `camera.pan()` again (Phaser cancels the prior tween internally) without error — `tests/unit/camera/CameraController.test.ts`
- [ ] T018 [P] [US2] Write failing e2e test: after moving the active character one tile, `camera.midPoint` matches the destination tile's world centre within 2 px after the tween completes (wait 200 ms) — `tests/e2e/camera.spec.ts`

### Implementation for User Story 2

- [ ] T019 [US2] Implement `CameraController.followTo(coord: HexCoord, pathLength: number)`: compute world position via `tileWorldPos`, compute duration via `Math.min(TWEEN_DURATION_PER_TILE * pathLength, TWEEN_MAX_DURATION)`, call `camera.pan(x, y, duration, TWEEN_EASE)` — `src/modules/camera/CameraController.ts`
- [ ] T020 [US2] In `WorldMap.onTileClick()`, after `moveOccupant()` succeeds, call `cameraController.followTo(dest, path.length)` before the existing sprite tween — `src/game/scenes/WorldMap.ts`

**Checkpoint**: US2 complete. Character movement drives smooth camera follow on every move. All T015–T018 tests now pass.

---

## Phase 5: User Story 3 — Manual Camera Pan & Re-center Button (Priority: P3)

**Goal**: Arrow keys and WASD scroll the camera at 5 tiles/sec independently of any character. Opposing keys cancel. A persistent re-center button (bottom-right) triggers a 300 ms ease-out tween back to the active character and resumes follow mode.

**Independent Test**: Hold Right Arrow — confirm camera scrolls right at ≈ 180 px/s independent of character. Release — confirm camera stops. Click re-center button — confirm camera tweens back to active character.

### Tests for User Story 3 (keyboard pan) ⚠️ Write these FIRST — they must FAIL before T026–T027

- [ ] T021 [US3] Write failing unit test: `update({ right: true, left: false, up: false, down: false }, 16)` increases `camera.scrollX` by `PAN_SPEED * (16 / 1000)` ≈ 2.88 px — `tests/unit/camera/CameraController.test.ts`
- [ ] T022 [P] [US3] Write failing unit test: `update({ right: true, left: true, up: false, down: false }, 16)` results in zero horizontal scroll (opposing keys cancel) — `tests/unit/camera/CameraController.test.ts`
- [ ] T023 [P] [US3] Write failing unit test: `isFreePanActive` returns `true` while any pan key is held and `false` when all are released — `tests/unit/camera/CameraController.test.ts`
- [ ] T024 [P] [US3] Write failing e2e test: holding `ArrowRight` for 500 ms moves `camera.scrollX` by ≈ 90 px (180 px/s × 0.5 s ± 10 px tolerance) — `tests/e2e/camera.spec.ts`
- [ ] T025 [P] [US3] Write failing e2e test: after panning away, moving the active character calls `followTo()` and camera returns to character tile — `tests/e2e/camera.spec.ts`

### Implementation for User Story 3 (keyboard pan)

- [ ] T026 [US3] Implement `CameraController.update(keys: CameraKeys, delta: number)`: compute per-axis delta `= PAN_SPEED * (delta / 1000)`, cancel opposing axes, apply to `camera.scrollX` / `camera.scrollY`; update `_freePanActive` based on any key being held — `src/modules/camera/CameraController.ts`
- [ ] T027 [US3] Add `update()` scene lifecycle method to `WorldMap`; in `create()` register `this.input.keyboard!.createCursorKeys()` and individual WASD `addKey()` calls; each frame pass key states as `CameraKeys` and `delta` to `cameraController.update()` — `src/game/scenes/WorldMap.ts`

### Tests for User Story 3 (re-center button) ⚠️ Write these FIRST — they must FAIL before T030–T031

- [ ] T028 [P] [US3] Write failing unit test: `reCenterOn(coord)` calls `camera.pan(x, y, 300, 'Quad.easeOut')` and does not call when `isTweening` is already true (double-trigger guard) — `tests/unit/camera/CameraController.test.ts`
- [ ] T029 [P] [US3] Write failing e2e test: clicking the re-center button after panning away causes `camera.midPoint` to match the active character's tile world centre within 2 px after 350 ms — `tests/e2e/camera.spec.ts`

### Implementation for User Story 3 (re-center button)

- [ ] T030 [US3] Implement `CameraController.reCenterOn(coord: HexCoord)`: guard `isTweening`; set `isTweening = true`; call `camera.pan(x, y, 300, 'Quad.easeOut')`; listen for pan-complete callback to reset `isTweening = false` — `src/modules/camera/CameraController.ts`
- [ ] T031 [US3] In `WorldMap.create()` create a fixed DOM `<button>` (`class="fixed bottom-4 right-4 z-30 …"`) labelled "⌖ Re-center"; wire `click` handler to call `cameraController.reCenterOn(activeCharCoord)`; store reference as `private reCenterBtn`; in `shutdown()` call `this.reCenterBtn?.remove(); this.reCenterBtn = null` — `src/game/scenes/WorldMap.ts`

**Checkpoint**: US3 complete. Keyboard pan, opposing-key cancellation, and re-center button all work. All T021–T029 tests now pass.

---

## Final Phase: Polish & Cross-cutting Concerns

- [ ] T032 [P] Verify `CameraController.isFreePanActive` getter returns correct value for all state transitions in the data-model.md state table (follow → free-pan on key press; free-pan → follow on `followTo()` or `reCenterOn()`) — confirm via existing T023 or add additional assertions — `src/modules/camera/CameraController.ts`
- [ ] T033 [P] Audit `WorldMap.ts` for any remaining references to `this.scale.width / 2` or `this.scale.height / 2` used for tile/sprite positioning (there should be none after T005–T006); fix any missed occurrences — `src/game/scenes/WorldMap.ts`
- [ ] T034 Run full `vitest run` + `playwright test` suite and confirm all tests pass with no regressions in existing `smoke.spec.ts`, `new-game.spec.ts`, and `perf-*.spec.ts` files

---

## Dependency Graph

```
T001 ──┐
T002   ├── T005 ── T006 ── T007 (green baseline)
T003   │              │
T004 ──┘              │
                      ▼
              T008..T011 (US1 tests)
                      │
              T012..T014 (US1 impl)
                      │
              T015..T018 (US2 tests)
                      │
              T019..T020 (US2 impl)
                      │
              T021..T025 (US3 pan tests)
                      │
              T026..T027 (US3 pan impl)
                      │
              T028..T029 (US3 recenter tests)
                      │
              T030..T031 (US3 recenter impl)
                      │
              T032..T034 (polish)
```

**Independent stories**: US1, US2, US3 are sequential (each builds on the camera instance from the previous phase). Within each phase, test tasks marked **[P]** can run in parallel since they target the same file but are non-conflicting describe blocks.

---

## Parallel Execution Examples

**Phase 1 parallelizable** (different files, no deps on each other):
- T002 (`index.ts`) ∥ T003 (`CameraController.test.ts` skeleton) ∥ T004 (`camera.spec.ts` skeleton)

**US1 parallelizable**:
- T009 (unit centerOn) ∥ T010 (e2e new-game) ∥ T011 (e2e resume-save)

**US2 parallelizable**:
- T016 (unit duration cap) ∥ T017 (unit mid-flight) ∥ T018 (e2e follow tween)

**US3 parallelizable**:
- T022 (unit opposing keys) ∥ T023 (unit isFreePanActive) ∥ T024 (e2e pan speed) ∥ T025 (e2e resume follow)
- T028 (unit reCenterOn) ∥ T029 (e2e re-center button)

---

## Implementation Strategy

**MVP** (US1 only — T001–T014): The coordinate refactor + camera centering at load delivers immediate orientation value and provides the foundation for all camera work. This is the smallest independently shippable increment.

**Increment 2** (+ US2 — T015–T020): Follow tween makes movement feel polished and spatial context is maintained across moves.

**Increment 3** (+ US3 — T021–T034): Manual pan and re-center button give players full camera control for tactical planning.

---

## Task Summary

| Phase | Tasks | Stories | Parallel Opportunities |
|-------|-------|---------|------------------------|
| Phase 1: Setup | T001–T004 | — | T002, T003, T004 |
| Phase 2: Foundational | T005–T007 | — | None (sequential, atomic) |
| Phase 3: US1 (P1) | T008–T014 | US1 | T009, T010, T011 |
| Phase 4: US2 (P2) | T015–T020 | US2 | T016, T017, T018 |
| Phase 5: US3 (P3) | T021–T031 | US3 | T022–T025, T028–T029 |
| Final Phase: Polish | T032–T034 | — | T032, T033 |
| **Total** | **34** | **3** | **12 parallel slots** |
