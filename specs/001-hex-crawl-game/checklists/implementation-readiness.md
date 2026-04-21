# Implementation Readiness Checklist: Hex Crawl Game — Core Experience

**Purpose**: Validate that tasks are complete, unambiguous, and actionable enough for a developer to begin coding without needing to re-read spec or plan for clarification  
**Created**: 2026-04-21  
**Feature**: [tasks.md](../tasks.md) · [spec.md](../spec.md) · [plan.md](../plan.md)  
**Focus**: Implementation readiness — task completeness, unambiguity, and actionability  
**Depth**: Thorough — includes NFRs, measurability, edge case task coverage  
**Audience**: Developer starting implementation now

---

## Phase Sequencing & Dependency Requirements

- [X] CHK001 — Is the Phase 2 "BLOCKS ALL" constraint expressed with enough specificity that a developer knows they MUST NOT begin any T020+ task until T010–T019 are all complete? [Completeness, tasks.md §Phase 2]
- [X] CHK002 — Are all Phase 1 checkpoint criteria ("`npm run dev` starts, `npm run test` runs, Playwright config valid") individually verifiable with concrete commands, or are some subjective? [Measurability, tasks.md §Phase 1 Checkpoint]
- [X] CHK003 — Is T001 ("scaffold from template") specific enough to succeed without ambiguity — is the exact template URL or `npm create` command documented, or must the developer look it up? [Clarity, tasks.md:T001, Gap]
- [X] CHK004 — Is the Phase 2–to–3 handoff measurable — does the Phase 2 checkpoint define which test command to run and what "all model files compile without errors" means in terms of a CI-runnable command? [Measurability, tasks.md §Phase 2 Checkpoint]

---

## Task Completeness — Models & Utilities (Phase 2)

- [X] CHK005 — Does T010 specify enough detail that a developer knows what TypeScript construct to use for each type (interface vs. type alias vs. enum vs. class)? [Clarity, tasks.md:T010]
- [X] CHK006 — Are the exact fields for each model in T010 documented per data-model.md, or must the developer cross-reference the full data-model.md themselves for each interface? [Completeness, tasks.md:T010]
- [X] CHK007 — Does T016 (PRNG) specify the exact xoshiro128** algorithm variant clearly enough that two developers would independently produce interoperable implementations with the same entropy output? [Clarity, tasks.md:T016, Ambiguity]
- [X] CHK008 — Does T017 (DiceRoller) specify what constitutes "natural 20" and "natural 1" (i.e., raw die face, not total) unambiguously enough for a developer to implement `isCritical`/`isFumble` correctly? [Clarity, tasks.md:T017, Ambiguity]
- [X] CHK009 — Does T019 (Zod schemas) specify the source of truth for which fields are required vs. optional in `SaveState`, or must the developer infer this entirely from the model interfaces? [Completeness, tasks.md:T019, Gap]

---

## Task Completeness — HexGrid & Map (Phase 3)

- [X] CHK010 — Does T024 (`HexCoordUtils.ts`) specify the exact pixel layout formula (flat-top vs. pointy-top hex, tile size in pixels) needed to implement `toPixel()`/`fromPixel()` correctly? [Clarity, tasks.md:T024, Ambiguity] — **Patched**: T024 now specifies pointy-top orientation with formula.
- [X] CHK011 — Does T025 (`MapGenerator.ts`) specify the elevation and moisture threshold ranges used to classify biomes, or is the biome lookup table left entirely to the developer to define? [Completeness, tasks.md:T025, Gap] — **Developer decision**: biome thresholds intentionally left to implementor; research.md specifies structure and formula.
- [X] CHK012 — Does T025 say how "island edge shaping" is implemented (e.g., distance-from-center falloff, explicit water ring), or is the technique undefined? [Clarity, tasks.md:T025, Ambiguity]
- [X] CHK013 — Does T027 (A\* pathfinding) specify whether the algorithm must produce the optimal path or just any valid path, and whether tie-breaking is required for deterministic output? [Clarity, tasks.md:T027, Ambiguity]
- [X] CHK014 — Does T030 (`classes.ts`) specify which stats are included in `growthRates` and what valid growth rate values are (e.g., 0.0–1.0 probability per level)? [Completeness, tasks.md:T030, Gap] — **Patched**: T030 now specifies `0.0–1.0` probability range with example.
- [X] CHK015 — Does T034 (`WorldMap.ts` scene) specify what render method to use for the hex tilemap ("staggered hex or manual tile rendering") unambiguously, or is the rendering approach left as an open implementation choice? [Clarity, tasks.md:T034, Ambiguity]
- [X] CHK016 — Does T035 (`StatPanel.ts`) specify the exact attributes displayed (HP, class, level, STR, DEX, CON, INT, WIS, CHA) or just "Attributes grid" — leaving field enumeration to the developer? [Completeness, tasks.md:T035, Gap]

---

## Task Completeness — Combat (Phase 4)

- [X] CHK017 — Does T041 (`CombatState.ts`) define where the initial unit positions on the tactical hex grid come from when a combat encounter starts (derived from world map coordinates, fixed spawn points, randomized)? [Completeness, tasks.md:T041, Gap] — **Developer decision**: units enter combat at their current world-map tile coords; tactical view renders that subset.
- [X] CHK018 — Does T042 (`DiceResolver.ts`) specify the attack roll formula (e.g., d20 + STR modifier vs. AC) or is the combat math system left undefined in tasks, requiring spec cross-reference? [Completeness, tasks.md:T042, Gap] — **Patched**: T042 now specifies full formula (d20 + hitBonus ≥ 10 + defenseBonus; 1d6 damage).
- [X] CHK019 — Does T043 (`PhaseManager.ts`) specify what data structure is used to sequence enemy units within their phase (queue, sorted by speed, random), or is ordering undefined? [Clarity, tasks.md:T043, Ambiguity] — **Patched**: T043 now specifies array-index order from `encounter.enemyUnits[]`.
- [X] CHK020 — Does T043 specify what the simple enemy AI does when no player unit is within attack range — does it stop, wait, or cycle through a fallback behavior? [Completeness, tasks.md:T043, Gap]
- [X] CHK021 — Does T046 (`Combat.ts` scene) specify what tile size and grid dimensions the tactical hex arena uses (e.g., same tile size as world map, different combat-specific grid)? [Clarity, tasks.md:T046, Ambiguity] — **Developer decision**: same tile size as world map; tactical view is a zoomed-in subset.
- [X] CHK022 — Does T047 (`DiceRollOverlay.ts`) specify the exact visual layout — which values appear on which lines, how crit/fumble badge is styled differently — or is layout left entirely to the developer's discretion? [Completeness, tasks.md:T047, Gap]
- [X] CHK023 — Is the "combat ends when side is eliminated" condition specified in T041 or T045 — specifically, does "eliminated" mean all dead/incapacitated or all dead only (given Casual-mode incapacitation)? [Clarity, tasks.md:T041/T045, Ambiguity] — **Developer decision**: "eliminated" = all units at 0 HP (dead or incapacitated); `RunEndDetector` determines the downstream consequence per mode.

---

## Task Completeness — Progression (Phase 5)

- [X] CHK024 — Does T052 (`ProgressionService.ts`) specify the XP threshold function (flat amount per level, scaling curve, class-specific)? [Completeness, tasks.md:T052, Gap] — **Patched**: T052 now specifies `xpToNextLevel = character.level * 100`.
- [X] CHK025 — Does T052 say whether `awardXp` returns a new `Character` object or mutates in place, and is this consistent with the "pure" annotation? [Clarity, tasks.md:T052, Ambiguity]
- [X] CHK026 — Does T054 (`applyPromotion`) specify what happens to the character's current HP on promotion — is it reset to new `maxHp`, scaled proportionally, or unchanged? [Completeness, tasks.md:T054, Gap] — **Patched**: T054 now specifies full heal to recalculated `maxHp` on promotion.

---

## Task Completeness — Save System (Phase 6)

- [X] CHK027 — Does T063 (`Serialiser.ts`) specify the exact `schemaVersion` value assigned for v1 and where that constant lives in the codebase? [Completeness, tasks.md:T063, Gap] — **Developer decision**: `CURRENT_SCHEMA_VERSION = 1` constant in `Serialiser.ts`; v1 is the initial version.
- [X] CHK028 — Does T064 (`Migrator.ts`) specify how to handle a save that is missing the `schemaVersion` field entirely (the pre-v1 baseline problem identified in A2), or is this guard logic unspecified? [Completeness, tasks.md:T064, Ambiguity] — **Patched**: T064 now specifies treat missing `schemaVersion` as version 0.
- [X] CHK029 — Does T065 (`IndexedDbStore.ts`) specify the database schema (store name, key path, indexes) needed to implement `listSlots()`, or must the developer determine the IndexedDB structure independently? [Completeness, tasks.md:T065, Gap] — **Developer decision**: DB name `hex-crawl-v1` (in task); store name `saves`, key `slot: number` — developer defines.
- [X] CHK030 — Does T066 (`FileExporter.ts`) specify the filename format for exported save files (e.g., `hex-crawl-save-{slot}-{timestamp}.json`)? [Completeness, tasks.md:T066, Gap] — **Developer decision**: format not prescribed.
- [X] CHK031 — Does T067 (`AutoSave.ts`) specify what event bus/emitter implementation to use — is there a shared event bus module already defined, or is each module expected to implement its own? [Completeness, tasks.md:T067, Gap] — **Developer decision**: T026 creates the simple event bus; T067 imports from it.

---

## Task Completeness — Mode & Recruitment (Phases 7–8)

- [X] CHK032 — Does T073 (`RunEndDetector.ts`) specify the exact condition for Casual mode — "party never ends in Casual" is a business rule; is this documented in the task or assumed from spec? [Clarity, tasks.md:T073]
- [X] CHK033 — Does T078 (recruitment unit tests) specify what constitutes a "valid" rollRecruitmentEncounter output in enough detail to write assertions — specifically, what fields of `RecruitmentEvent` are set? [Completeness, tasks.md:T078, Gap]
- [X] CHK034 — Does T079 (`TownService.ts`) specify how a `HireableHero` template is converted to a full `Character` — are all `Character` fields generated, and is there a randomization step for attributes? [Completeness, tasks.md:T079, Gap] — **Developer decision**: `HireableHero.characterTemplate` is `Omit<Character, 'id'|'recruitmentSource'|'actedThisPhase'>` per data-model — developer generates those 3 fields; no randomization (template is pre-authored).
- [X] CHK035 — Does T082 (`TownPanel.ts`) specify what "hire cost" means and where this value is sourced — is it a field on `HireableHero`, a flat fee, or calculated dynamically? [Completeness, tasks.md:T082, Gap]

---

## TDD Readiness — Test Tasks

- [X] CHK036 — Are all test tasks (T012–T015, T020–T023, T037–T040, T039a, T050–T051, T059–T062, T071–T072, T078, T093) written as "write failing test" tasks rather than "write test that passes" tasks, matching the Red→Green→Refactor mandate? [Completeness, tasks.md §TDD sections]
- [X] CHK037 — Does T022 (map-gen unit tests) specify enough seed/output pairs to make "biome distribution spot-check" a deterministic assertion rather than a subjective visual check? [Measurability, tasks.md:T022, Ambiguity]
- [X] CHK038 — Does T023 (Playwright new-game e2e) specify which DOM selector or canvas query is used to assert "character HUD contains HP value" — or is this assertion left undefined? [Clarity, tasks.md:T023, Ambiguity]
- [X] CHK039 — Are the T040 ("load save state with party adjacent to enemy camp") and T062 ("start game → move character → save → reload") Playwright tests backed by a documented fixture/seed strategy, or must the developer invent the test setup from scratch? [Completeness, tasks.md:T040/T062, Gap] — **Developer decision**: Playwright fixtures created as needed per test; seeded PRNG means any fixed seed works as a fixture.
- [X] CHK040 — Does T093 specify the exact Playwright timing API to use (`page.waitForSelector` with timeout, `performance.now()` snapshot, or `page.waitForFunction`) — or is the measurement technique left undefined? [Clarity, tasks.md:T093, Ambiguity] — **Developer decision**: Playwright `page.waitForFunction` with `Date.now()` delta is idiomatic.

---

## Architecture & Module Contract Readiness

- [X] CHK041 — Are all 6 module contract files present and readable (hex-grid, combat, progression, save, recruitment, meta-progression) before a developer begins implementation? [Completeness, contracts/]
- [X] CHK042 — Does `contracts/combat.contract.md` specify the `getPlayerControllableUnits()` method that T039a tests — if not, is the method definition traceable to a contract or only to a task? [Consistency, contracts/combat.contract.md, tasks.md:T039a] — **Patched**: `getPlayerControllableUnits(): string[]` added to combat contract.
- [X] CHK043 — Does `contracts/hex-grid.contract.md` specify the `occupant:moved` event payload shape — since T067 AutoSave subscribes to this event and the payload must be parseable? [Completeness, contracts/hex-grid.contract.md, tasks.md:T067]
- [X] CHK044 — Does `contracts/progression.contract.md` define the `character:levelUp` and `character:promoted` event payloads that T058 subscribes to in `StatPanel.ts`? [Completeness, contracts/progression.contract.md, tasks.md:T058]
- [X] CHK045 — Is there a shared event bus contract or module specification that all module-to-module event subscriptions (T026, T043, T058, T067) can reference, or does each module define its own event mechanism? [Completeness, Gap] — **Developer decision**: T026 (`HexGridStore.ts`) creates the event bus; other modules import it. No formal contract needed — bus is a simple typed emitter.

---

## Parallel Task Safety

- [X] CHK046 — Are the parallelizable task groups in each phase safe to run in parallel — specifically, do T016+T017+T018+T019 have no shared mutable file they would all write to simultaneously? [Consistency, tasks.md §Parallel Opportunities]
- [X] CHK047 — Can T002 and T003 truly be run in parallel before T001 completes, or do they require the scaffolded `package.json` to exist first? [Consistency, tasks.md §Phase 1, Dependency] — T002+T003 run in parallel with **each other** (after T001); tasks.md lists them sequentially after T001 and marks only mutual parallelism `[P]`.

---

## Implementation Entry Point Clarity

- [X] CHK048 — Is there one clearly identified "first task" with zero dependencies that a developer can start immediately — and is it T001, or is there a prerequisite (git branch, repo state) not captured in Phase 1? [Clarity, tasks.md:T001, Gap]
- [X] CHK049 — Does the `quickstart.md` file contain a runnable scaffold command (e.g., `npm create phaser@latest` or `npx degit`), or does the developer need to look up the template scaffold method independently? [Completeness, quickstart.md]
- [X] CHK050 — Is D1 (T035 creates StatPanel, T058 extends it) resolved in the task text — does T035 now indicate that event subscriptions are added in T058, so a developer does not close T035 prematurely? [Completeness, tasks.md:T035, D1]
