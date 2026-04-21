# Implementation Readiness Checklist: World Map Camera Behavior

**Purpose**: Gate check before writing tasks.md — validates that spec, plan, and data-model are
complete, unambiguous, and internally consistent enough to begin implementation.  
**Created**: 2026-04-21  
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md)

---

## Requirement Completeness

- [ ] CHK001 - Are requirements defined for all three user story flows (load centering, follow tween, manual pan)? [Completeness, Spec §US1–US3]
- [ ] CHK002 - Is the re-center button requirement fully specified with position, trigger behavior, and tween properties? [Completeness, Spec §FR-013]
- [ ] CHK003 - Are requirements defined for the camera's behavior when the active character switches (turn change, not just movement)? [Completeness, Spec §FR-004]
- [ ] CHK004 - Is the enemy/NPC turn camera behavior explicitly specified (stationary, no follow)? [Completeness, Spec §FR-012]
- [ ] CHK005 - Are boundary clamping requirements defined for all four map edges (not just described generically)? [Completeness, Spec §FR-010]
- [ ] CHK006 - Is the out-of-scope zoom exclusion explicitly documented so it cannot be accidentally implemented? [Completeness, Spec §FR-011]
- [ ] CHK007 - Are diagonal pan requirements (Up+Right, etc.) addressed — the spec assumption states "standard behavior" but no FR covers it? [Gap, Spec §Assumptions]

## Requirement Clarity

- [ ] CHK008 - Is "first interactive frame" (FR-001) defined precisely enough to be testable — specifically what event or lifecycle hook constitutes the frame boundary? [Clarity, Spec §FR-001]
- [ ] CHK009 - Is "immediately after movement is committed" (FR-002) defined clearly — does committed mean after `moveOccupant()` returns or after the sprite tween completes? [Ambiguity, Spec §FR-002]
- [ ] CHK010 - Is "perceptually smooth" quantified for the follow tween or is the 400/600 ms cap the sole measurable proxy? [Clarity, Spec §FR-003]
- [ ] CHK011 - Is the re-center button tween duration specified? The spec says "ease-out tween" but FR-013 does not give a duration (plan.md uses 300 ms — does spec need to match)? [Ambiguity, Spec §FR-013 vs Plan §CameraController interface]
- [ ] CHK012 - Is "the camera does not move on that axis" (FR-008) sufficient — does it also need to specify that the non-conflicting axis continues scrolling normally? [Clarity, Spec §FR-008]
- [ ] CHK013 - Is the visual design of the re-center button intentionally deferred to implementation, and is that deferral explicitly stated? [Clarity, Spec §Assumptions]

## Requirement Consistency

- [ ] CHK014 - Does the tween duration in the `CameraController` interface (`reCenterOn` = 300 ms) align with what the spec implies for FR-013? [Consistency, Spec §FR-013 vs Plan §Phase 1 Design]
- [ ] CHK015 - Is the 150 ms/tile formula in data-model.md consistent with the spec's "≤ 400 ms for single-tile" cap (150 ms < 400 ms ✓) and "≤ 600 ms" multi-tile cap? [Consistency, Spec §FR-003 vs data-model §Constants]
- [ ] CHK016 - Does the "active character" definition in spec Key Entities match the definition used in data-model.md `CameraState.followTargetId`? [Consistency, Spec §Key Entities vs data-model §CameraState]
- [ ] CHK017 - Does FR-009 (follow resumes when character moves) align with the state transition table where free-pan → follow is triggered by character move OR re-center button? [Consistency, Spec §FR-009 vs data-model §State Transitions]
- [ ] CHK018 - Is the pan speed constant (PAN_SPEED = 180 px/s at TILE_SIZE=36) consistent between data-model.md and the spec's "5 tiles per second" requirement? [Consistency, Spec §FR-007 vs data-model §Constants]

## Acceptance Criteria Quality

- [ ] CHK019 - Can SC-001 ("100% of test runs") be implemented as an automated test, or does "first interactive frame" require a frame-precise assertion mechanism? [Measurability, Spec §SC-001]
- [ ] CHK020 - Can SC-002 (≤ 400 ms / ≤ 600 ms tween) be measured reliably in a Playwright e2e test, or does it require a Vitest unit test with a mocked Phaser tween? [Measurability, Spec §SC-002]
- [ ] CHK021 - Can SC-003 ("within one rendered frame") be realistically verified in an automated test, or does it require a manual or performance-profiling test? [Measurability, Spec §SC-003]
- [ ] CHK022 - Does SC-005 ("50 map seeds") have a mechanism for generating deterministic seeds in the test suite, or is this reliant on the existing map generator? [Measurability, Spec §SC-005]

## Scenario Coverage

- [ ] CHK023 - Are requirements defined for the camera state when the world map scene is *destroyed* and re-entered (e.g. returning from Combat)? [Coverage, Gap]
- [ ] CHK024 - Is there an acceptance scenario for the re-center button specifically (US3 scenario 5 covers it, but no dedicated US exists for the button itself)? [Coverage, Spec §US3 S5]
- [ ] CHK025 - Are requirements defined for what happens when `followTo()` is called while a re-center tween is already in flight? [Coverage, Gap]
- [ ] CHK026 - Is scrolling behavior while a follow tween is in progress (pan key held during a character move) addressed in the spec edge cases? [Coverage, Spec §Edge Cases]

## Breaking Change & Regression Risk

- [ ] CHK027 - Is the coordinate system refactor (R-002: removing `offsetX/offsetY` viewport hack from `WorldMap.ts`) fully documented with rollback criteria if it breaks tile rendering? [Risk, Plan §R-002]
- [ ] CHK028 - Are the existing e2e tests in `tests/e2e/smoke.spec.ts` and `perf-*.spec.ts` expected to pass after the `WorldMap.ts` rendering refactor, and is the expected impact on them assessed? [Risk, Gap]
- [ ] CHK029 - Are sprite positions in `renderParty()` and the interactive hit areas in `renderMap()` both updated in the plan to remove the `offsetX/offsetY` addition, or only one of them? [Risk, Plan §R-002 vs WorldMap.ts renderParty/renderMap]
- [ ] CHK030 - Is the plan's claim that `CameraController` "has no imports from `WorldMap`" verifiable from the proposed interface — specifically does `HexTile` and `HexCoord` come from `src/models` rather than the scene? [Risk, Plan §Constitution Re-Check III]

## Plan & Design Completeness

- [ ] CHK031 - Does the plan specify which existing `WorldMap` fields (`selectedChar`, `charSprites`) the `CameraController` depends on, and how they are passed in? [Completeness, Plan §Integration Points]
- [ ] CHK032 - Is the `update()` scene lifecycle method new to `WorldMap.ts`, and is there a note that Phaser requires it to be declared on the scene class (not a separate class)? [Completeness, Plan §Integration Point 3]
- [ ] CHK033 - Is cleanup/teardown of the re-center DOM button documented in the plan (analogous to the existing `shutdown()` teardown for the save bar)? [Completeness, Gap]
- [ ] CHK034 - Are unit test targets for `CameraController.test.ts` specified beyond "unit: camera controller logic" — specifically which behaviors need direct unit tests vs. e2e coverage? [Completeness, Plan §Source Code]
- [ ] CHK035 - Is the `index.ts` public re-export for the `camera` module specified with what it exports (class only, or also interfaces and constants)? [Completeness, Plan §Source Code]

## Dependencies & Assumptions

- [ ] CHK036 - Is the assumption that feature `001-hex-crawl-game` already implements turn management sufficient — specifically is there an existing hook/event the CameraController can subscribe to for active character changes? [Assumption, Spec §Assumptions]
- [ ] CHK037 - Is the assumption that "there is always exactly one active character" validated against the actual turn system in `WorldMap.ts` (currently `selectedChar` can be null at init)? [Assumption, Spec §Assumptions vs WorldMap.ts L55]
- [ ] CHK038 - Is the Tailwind v4 CSS needed for the re-center button expected to work with the existing Tailwind setup, or does a new utility class need adding? [Dependency, Gap]
