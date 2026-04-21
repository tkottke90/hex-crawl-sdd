# Tasks: Hex Crawl Game — Core Experience

**Feature**: `001-hex-crawl-game` | **Date**: 2026-04-21  
**Input**: [spec.md](spec.md) · [plan.md](plan.md) · [data-model.md](data-model.md) · [research.md](research.md) · [contracts/](contracts/)  
**Tests**: TDD — per Constitution Principle II. All test tasks MUST fail before implementation begins (Red → Green → Refactor).

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can be worked in parallel with other [P] tasks in the same phase
- **[US#]**: Belongs to a specific user story
- Exact file paths in every task description

---

## Phase 1: Setup (Project Scaffold)

**Purpose**: Bootstrap the Phaser + Vite + TypeScript + Tailwind v4 + Vitest + Playwright project.

- [X] T001 Scaffold project from `phaserjs/template-vite-ts` official template into repository root; verify `npm run dev` starts at `http://localhost:5173`
- [X] T002 [P] Add runtime dependencies: `phaser`, `idb`, `simplex-noise`, `zod` via `npm install`
- [X] T003 [P] Add dev dependencies: `vitest`, `@vitest/coverage-v8`, `playwright`, `@playwright/test`, `tailwindcss`, `@tailwindcss/vite` via `npm install -D`
- [X] T004 Configure `vite.config.ts`: add `@tailwindcss/vite` plugin, set `base: './'`, add `manualChunks: { phaser: ['phaser'] }` in `build.rollupOptions.output`
- [X] T005 Configure `tsconfig.json`: `strict: true`, `strictPropertyInitialization: false`, `target: "ES2022"`, `module: "ESNext"`, `moduleResolution: "bundler"`
- [X] T006 Create `src/style.css` with `@import "tailwindcss"` and import it from `src/main.ts`
- [X] T007 [P] Create Vitest config `vitest.config.ts`: `environment: 'jsdom'`, coverage via `@vitest/coverage-v8`, include `tests/unit/**`
- [X] T008 [P] Create Playwright config `playwright.config.ts`: `baseURL: 'http://localhost:5173'`, Chromium only for v1
- [X] T009 Create `src/main.ts` entry point that instantiates the Phaser `Game` object (config stubbed) and imports `./style.css`

**Checkpoint**: `npm run dev` starts, `npm run test` runs (no tests yet, zero failures), Playwright config valid.

---

## Phase 2: Foundational (Shared Utilities & Models)

**Purpose**: Utilities and TypeScript models that ALL user stories depend on. No story work begins until this phase is complete.

**⚠️ CRITICAL**: This phase BLOCKS all user story phases.

- [X] T010 Create all TypeScript model interfaces from `data-model.md` in files under `src/models/`
- [X] T011 Create `src/models/index.ts` barrel export for all model interfaces
### TDD — Write Tests First (must FAIL before T016)

- [X] T012 [P] Write unit tests for `src/utils/prng.ts` in `tests/unit/utils/prng.test.ts`: determinism (same seed → same sequence), uniform distribution spot-check, range bounds.
- [X] T013 [P] Write unit tests for `src/utils/dice.ts` in `tests/unit/utils/dice.test.ts`: notation parsing, modifier arithmetic, crit/fumble detection, reproducibility with fixed seed.
- [X] T014 [P] Write unit tests for `src/utils/noise.ts` in `tests/unit/utils/noise.test.ts`: seeded determinism, output range 0–1.
- [X] T015 [P] Write unit tests for Zod schemas in `tests/unit/schemas/`: hex invariant, SaveState round-trip + gold assertions, CharacterSchema role/deathRecord, WorldMapSchema.

### Implementation

- [X] T016 [P] Implement `src/utils/prng.ts`: seedable xoshiro128** PRNG class; `constructor(seed: string)`, `next(): number` (0–1), `nextInt(min, max): number`. Pure — no Phaser dependency.
- [X] T017 [P] Implement `src/utils/dice.ts`: `DiceRoller` class; `roll(notation: string, prng: PRNG): DiceRoll` (parses "2d6+3" etc.), returns `{ dice, modifier, total, isCritical, isFumble }`. Pure.
- [X] T018 [P] Implement `src/utils/noise.ts`: thin wrapper over `simplex-noise`; exports `createNoise2D(seed: string): (x: number, y: number) => number` returning normalised 0–1 values.
- [X] T019 [P] Write Zod schemas in `src/schemas/` mirroring each model: `src/schemas/save.schema.ts`, `src/schemas/hex.schema.ts`, `src/schemas/character.schema.ts`, `src/schemas/world-map.schema.ts`. Export `SaveStateSchema` as root parse entry.

**Checkpoint**: `npm run test` passes all unit tests for utilities and schemas. All model files compile without errors.

---

## Phase 3: User Story 1 — Start a New Game & Enter the World (Priority: P1) 🎯 MVP

**Goal**: Player can open the game, choose a mode, see a procedurally generated hex map with their starting party of 2 characters, and move a character to an adjacent tile.

**Independent Test**: `npm run dev` → Select New Game → Choose mode → Hex map renders → Click adjacent passable tile → Character moves. No combat, saves, or progression required.

### TDD — Write Tests First (must FAIL before T030)

- [X] T020 [P] [US1] Write unit tests for `HexGridModule` coord math in `tests/unit/hex-grid/coords.test.ts`: `neighbors()` returns 6, `distance()` cube formula, `toPixel()`/`fromPixel()` round-trip, invariant assertion on construction.
- [X] T021 [P] [US1] Write unit tests for `HexGridModule` pathfinding in `tests/unit/hex-grid/pathfinding.test.ts`: `findPath()` returns shortest path, returns `null` for impassable, `reachableTiles()` respects moveCost budget.
- [X] T022 [P] [US1] Write unit tests for map generation in `tests/unit/hex-grid/map-gen.test.ts`: same seed → identical map, all tiles have valid `TerrainType`, `playerStartCoord` is passable, biome distribution spot-check.
- [X] T023 [P] [US1] Write Playwright e2e test for the new-game flow in `tests/e2e/new-game.spec.ts`: load page → click New Game → choose mode → assert canvas is visible → assert character HUD contains HP value.

### Implementation

- [X] T024 [US1] Implement `src/modules/hex-grid/HexCoordUtils.ts`: `makeCoord(q,r): HexCoord` (asserts `q+r+s===0`), `neighbors()`, `distance()`, `toPixel()`, `fromPixel()`. Use **pointy-top hex orientation** (flat edges at left/right, vertices at top/bottom): `toPixel = { x: size*(√3*q + √3/2*r), y: size*(3/2*r) }`. Export from `src/modules/hex-grid/index.ts`.
- [X] T025 [US1] Implement `src/modules/hex-grid/MapGenerator.ts`: `generateMap(seed: string, width: number, height: number): WorldMap`. Two simplex-noise passes (elevation + moisture) → biome lookup → `HexTile[]`. Island edge shaping. Returns `WorldMap` with `playerStartCoord` on passable tile.
- [X] T026 [US1] Implement `src/modules/hex-grid/HexGridStore.ts`: in-memory `WorldMap` store; `getTile()`, `queryTiles()`, `moveOccupant()`, `exploreTile()`. Emits `tile:explored` and `occupant:moved` events via a simple event bus.
- [X] T027 [US1] Implement A* pathfinding in `src/modules/hex-grid/Pathfinder.ts`: `findPath(start, end, map): HexCoord[] | null`. Binary-heap priority queue, `cube_distance` heuristic, respects `passable` and `moveCost`.
- [X] T028 [US1] Implement `src/modules/hex-grid/ReachableTiles.ts`: BFS flood-fill `reachableTiles(origin, movePoints, map): HexTile[]`.
- [X] T029 [US1] Assemble `src/modules/hex-grid/index.ts`: export a factory `createHexGridModule(map: WorldMap): HexGridModule` satisfying the contract in `contracts/hex-grid.contract.md`.
- [X] T030 [US1] Create data `src/data/classes.ts`: define at least 4 base `ClassDefinition` objects (e.g. `fighter`, `rogue`, `mage`, `cleric`) with `growthRates`, `promotionLevel: 10`, `promotionPaths` pointing to promoted class IDs. Define 8 promoted classes. **`growthRates` values are probabilities `0.0–1.0`** — e.g. `str: 0.6` means 60% chance STR increases on each level-up. `applyLevelUp` checks `prng.next() < growthRates[stat]` for each stat. Also create `src/data/escort.ts`: a pre-authored Escort `Character` template (name: "The Ward", class: `fighter`, level 1, fixed base stats — `role: 'escort'` and `recruitmentSource: 'starting'` are assigned at run start in T034; template omits `id`, `deathRecord`, `actedThisPhase`).
- [X] T031 [US1] Create `src/game/scenes/Boot.ts` Phaser scene: registers all asset keys for tilesets and character portraits (placeholder 32×32 colored tiles acceptable for v1).
- [X] T032 [US1] Create `src/game/scenes/Preloader.ts` Phaser scene: loads all assets registered in Boot, shows progress bar using a Tailwind-styled HTML overlay (`pointer-events-none`).
- [X] T033 [US1] Create `src/game/scenes/MainMenu.ts` Phaser scene: "New Game" button → mode selection (Casual / Roguelike) → **class selection** (renders one card per `ClassDefinition` from `src/data/classes.ts` with name, tier, and a brief stat summary; player picks one) → emits `game:start` with chosen `GameMode` and selected `classId`. Mode label persisted in scene registry. Load Game and Import Save buttons also present (wired in T069).
- [X] T034 [US1] Create `src/game/scenes/WorldMap.ts` Phaser scene: on `game:start`, calls `generateMap(seed, 40, 30)`, creates `HexGridModule`, renders hex tilemap via Phaser `TilemapLayer` (staggered hex or manual tile rendering). Constructs the starting party: exactly 1 **PC** (player-chosen class from mode-select screen, `role: 'pc'`, `recruitmentSource: 'starting'`) and 1 **Escort** (pre-authored template from `src/data/escort.ts`, `role: 'escort'`, `recruitmentSource: 'starting'`). Both characters placed at `playerStartCoord`. Handles tile click → `findPath` → `moveOccupant` → tween character sprite. **Initialises the run `SaveState.gold` to 20 (FR-012d starting gold) when constructing the initial save snapshot passed to `Serialiser`/`AutoSave`.**
- [X] T035 [US1] Create `src/game/ui/StatPanel.ts`: Tailwind HTML overlay (`pointer-events-none` except panel itself); renders selected `Character` name, class, level, HP bar, and `Attributes` grid. Subscribes to `character:selected` event.
- [X] T036 [US1] Wire `src/game/main.ts` Phaser `Game` config: register Boot → Preloader → MainMenu → WorldMap scene pipeline. Set `type: Phaser.AUTO`, `parent: 'game-container'`, pointered input enabled.

**Checkpoint**: Player Story 1 fully functional. `npm run test` passes all T020–T023 tests. `npm run dev` → new game → hex map → character moves.

---

## Phase 4: User Story 2 — Tactical Combat Encounter (Priority: P2)

**Goal**: Player enters a hex tile with an enemy camp; a tactical combat screen opens; turns proceed phase-by-phase (Player Phase then Enemy Phase); dice rolls are shown; HP updates; combat resolves.

**Independent Test**: Trigger a scripted encounter (DEV shortcut key acceptable). Complete a full round. Verify: dice roll UI appears, HP decreases, turn phase label switches, combat ends when side is eliminated.

### TDD — Write Tests First

- [X] T037 [P] [US2] Write unit tests for `CombatModule` phase management in `tests/unit/combat/phase.test.ts`: `startPlayerPhase()` resets `actedThisPhase` for all player characters, `endPlayerPhase()` transitions to enemy phase, all enemies act before `startPlayerPhase()` again.
- [X] T038 [P] [US2] Write unit tests for `CombatModule` dice resolution in `tests/unit/combat/dice-resolution.test.ts`: attack roll against AC, damage roll, crit detection (natural 20), fumble detection (natural 1), HP mutation.
- [X] T039 [P] [US2] Write unit tests for `CombatModule` mode rules in `tests/unit/combat/mode-rules.test.ts`: Both Casual and Roguelike → character `status` becomes `'dead'` at 0 HP (no `incapacitated` state). **Mode difference is save behavior only — not character status.** Verify `applyDefeat(character, casualMode, coord, turn)` and `applyDefeat(character, roguelikeMode, coord, turn)` both return `status: 'dead'` and `deathRecord: { coord, turn }`. **Scope: pure-function behavior of `ModeRules.ts` only. PC/Escort run-end logic and `invalidated` flag coverage belongs in T071.**
- [X] T039a [P] [US2] Write unit tests for player input guard in `tests/unit/combat/player-input-guard.test.ts`: `getPlayerControllableUnits()` returns the full player roster during Player Phase; returns an empty array during Enemy Phase. Satisfies FR-004b.
- [ ] T040 [P] [US2] Write Playwright e2e test `tests/e2e/combat.spec.ts`: load save state with party adjacent to enemy camp → move onto camp tile → assert combat UI visible → perform one attack → assert dice roll UI visible → assert HP changed.

### Implementation

- [X] T041 [US2] Implement `src/modules/combat/CombatState.ts`: manages `CombatEncounter` state; tracks `phase`, `activeUnit`, `log`. Provides `getValidMoveTargets()`, `getAttackTargets()`. **Also provides `isCombatOver(): { over: boolean; winner: 'player' | 'enemy' | null }` — returns `over: true` when ALL units on one side have `status === 'dead'`; `winner` is `'player'` if all enemy units are dead, `'enemy'` if all PC/Escort/Adventurer units are dead. `'incapacitated'` no longer exists — `status === 'dead'` is the only terminal state.**
- [X] T042 [US2] Implement `src/modules/combat/DiceResolver.ts`: `resolveAttack(attacker, defender, prng): DiceRoll`; applies `hitBonus`, `defenseBonus`, crit/fumble logic; mutates HP on attacker/defender copies (no in-place mutation). **Attack formula**: roll `1d20`; hit if `roll + attacker.hitBonus >= 10 + defender.defenseBonus` (DC = 10 + defenseBonus); nat 20 → `isCritical: true` — double the damage dice (but AC check still applies — a nat 20 is NOT an auto-hit); nat 1 → `isFumble: true` — auto-miss regardless of modifiers, displayed as "Critical Miss" (placeholder for v2 fumble effects). Damage on hit: `1d6 + attacker.hitBonus` (base; class-specific override future). `hitBonus` and `defenseBonus` derived from `data-model.md` formulas.
- [X] T043 [US2] Implement `src/modules/combat/PhaseManager.ts`: `startPlayerPhase()`, `endPlayerPhase()`, `runEnemyPhase(ai)`. `actedThisPhase` flag maintenance. Simple enemy AI: move toward nearest player, attack if in range. **Enemy units act in the order they appear in `encounter.enemyUnits[]`** (array index 0 first). If no player is in attack range after moving, the enemy waits (no further action that turn).
- [X] T044 [US2] Implement `src/modules/combat/ModeRules.ts`: `applyDefeat(character: Character, mode: GameMode, coord: HexCoord, turn: number): Character` — returns updated character with `status: 'dead'` in **both modes**. The mode distinction is purely in save behavior (reload allowed in Casual; save invalidated in Roguelike) — character status is always `'dead'` at 0 HP. Sets `deathRecord: { coord, turn }`. **`coord` and `turn` are passed in by the caller (Combat scene) — not read from the character.** Pure function.
- [X] T045 [US2] Assemble `src/modules/combat/index.ts`: export `createCombatModule(encounter: CombatEncounter, mode: GameMode, prng: PRNG): CombatModule` satisfying `contracts/combat.contract.md`.
- [X] T045a [US2] Implement `src/modules/combat/ItemService.ts` — v1 stub: `useItem(character: Character, itemId: string): Character` returns character unchanged and emits a `item:not-available` event. No item inventory exists in v1; this stub satisfies composability (Constitution Principle IV) so item logic can be layered in v2 without touching the combat phase loop.
- [X] T046 [US2] Create `src/game/scenes/Combat.ts` Phaser scene: receives `CombatEncounter` via scene data; renders tactical hex grid (subset of world map); renders unit sprites; exposes player action UI (Move / Attack / Wait / **Use Item** buttons — Use Item calls `ItemService.useItem()` stub in v1, button is present but shows "No items" toast); subscribes to `CombatModule` events to animate dice roll overlay and HP changes.
- [X] T047 [US2] Create `src/game/ui/DiceRollOverlay.ts`: Tailwind-styled HTML overlay; receives `DiceRoll`; displays individual dice values, modifier, total, crit/fumble badge. Auto-dismisses after 2 seconds or on click.
- [X] T048 [US2] Create `src/game/ui/PhaseLabel.ts`: HUD element always visible in combat; shows "PLAYER PHASE" / "ENEMY PHASE" with appropriate color. Subscribes to phase change events.
- [X] T049 [US2] Wire `WorldMap.ts` to detect `EnemyCamp` tile entry and launch `Combat` scene with the encounter data. On player victory (and `checkRunEnd()` is `false`): launch `VictorySummary` scene; on its `map:clear-enemy-tile` event, clear the enemy tile (remove PoI tag, mark passable empty) and return to `WorldMap.ts`. If `checkRunEnd()` is `true`, launch `RunEnd` scene instead.

**Checkpoint**: US2 complete. `npm run test` passes T037–T040. Full combat sequence works in browser.

---

## Phase 5: User Story 3 — Character Progression & Class Evolution (Priority: P3)

**Goal**: After combat XP award, characters level up with stat growth. At level 10, player chooses a promotion path. Stat block reflects changes.

**Independent Test**: DEV shortcut grants 9999 XP to character. Verify: level-up fires, stats increase per growth rates, at level 10 promotion modal appears with 2+ options, selecting one updates class/portrait/stats.

### TDD — Write Tests First

- [X] T050 [P] [US3] Write unit tests for XP/level-up in `tests/unit/progression/level-up.test.ts`: `awardXp()` triggers `levelUp` event at threshold; `applyLevelUp()` rolls growth rates per `ClassDefinition.growthRates`; maxHp recalculated.
- [X] T051 [P] [US3] Write unit tests for promotion in `tests/unit/progression/promotion.test.ts`: `getPromotionOptions()` returns correct class IDs at `promotionLevel`; `applyPromotion()` swaps classId, resets level to 1, applies base stat bonuses, clears promotionPaths.

### Implementation

- [X] T052 [US3] Implement `src/modules/progression/ProgressionService.ts`: `awardXp(character, amount): Character` — increments XP, fires `character:levelUp` event when threshold reached. `applyLevelUp(character, classDef): Character` — rolls each stat growth rate (`prng.next() < growthRates[stat]` → stat +1), recalculates `maxHp`. Pure — no `CombatModule` dependency. **XP threshold**: `xpToNextLevel = character.level * 100` — set on `Character` at character creation and after each level-up. E.g. level 1 needs 100 XP, level 5 needs 500 XP.
- [X] T053 [US3] Implement `getPromotionOptions(character, classDefs): ClassDefinition[]` in `ProgressionService.ts`; returns promoted class options when `character.level === classDef.promotionLevel`.
- [X] T054 [US3] Implement `applyPromotion(character, promotedClassDef): Character` in `ProgressionService.ts`: swaps `classId`, resets `level` to 1, `xp` to 0, applies `promotedClassDef.baseStats` as additive bonuses to `attributes`, clears `promotionPaths`. **HP on promotion**: recalculate `maxHp = promotedClassDef.maxHpBase + Math.floor((character.attributes.con - 10) / 2)`; set `hp = maxHp` (full heal on promotion).
- [X] T054a [US3] Assemble `src/modules/progression/index.ts`: export `createProgressionModule(): ProgressionModule` satisfying `contracts/progression.contract.md`.
- [X] T055 [US3] Create `src/game/ui/LevelUpOverlay.ts`: Tailwind modal overlay; shows stat diff (+STR, +DEX, etc.) on level-up; auto-dismisses after player clicks or 3 seconds.
- [X] T056 [US3] Create `src/game/ui/PromotionModal.ts`: Tailwind modal; renders 2+ `ClassDefinition` cards with name, tier, stat previews; waits for player selection; emits `character:promoted` event with chosen class.
- [X] T057 [US3] Wire level-up and promotion into `Combat.ts` post-combat XP award: call `ProgressionModule.awardXp()` for each surviving character via its public contract interface; show `LevelUpOverlay` for any that levelled, show `PromotionModal` for any that hit `promotionLevel`. `Combat.ts` MUST NOT import `ProgressionService` directly — use the module factory.
- [X] T057a [US3] Create `src/game/scenes/VictorySummary.ts` Phaser scene: shown after player wins combat (before returning to world map); displays enemies defeated, XP earned per character, any character deaths that occurred during the encounter, and a "Continue" button. On "Continue", emits `map:clear-enemy-tile` with the defeated encounter's `HexCoord`, then transitions to `WorldMap.ts`. This scene is NOT shown when `RunEndDetector.checkRunEnd()` is `true` (run-end uses `RunEnd.ts` instead).
- [X] T058 [US3] Update `StatPanel.ts` to re-render on `character:levelUp` and `character:promoted` events.

**Checkpoint**: US3 complete. Tests T050–T051 pass. Level-up and promotion flows work in browser.

---

## Phase 6: User Story 4 — Save & Resume Game (Priority: P4)

**Goal**: Player can save to IndexedDB, load back, export `.json` to device, and import from device. Roguelike mode auto-saves. Save schema validated by Zod on import.

**Independent Test**: Save → close tab → reopen → Load → verify exact map position, party HP, mode restored. Export `.json` → re-import → same result.

### TDD — Write Tests First

- [X] T059 [P] [US4] Write unit tests for `SaveModule` serialisation in `tests/unit/save/serialise.test.ts`: `serialise(gameState): SaveState` produces valid JSON; `SaveStateSchema.safeParse()` accepts it; version field present.
- [X] T060 [P] [US4] Write unit tests for `SaveModule` migration in `tests/unit/save/migration.test.ts`: `migrate(data, fromVersion, toVersion)` applies correct migration steps sequentially; unknown future version throws.
- [X] T061 [P] [US4] Write unit tests for `SaveModule` Zod import validation in `tests/unit/save/validation.test.ts`: valid save → passes; mangled `HexCoord` (invariant broken) → `safeParse` fails with descriptive error.
- [ ] T062 [P] [US4] Write Playwright e2e test `tests/e2e/save-load.spec.ts`: (a) browser storage round-trip — start game → move character → save → reload page → load save → assert character is on correct tile; (b) **SC-004 file round-trip** — export save via `FileExporter` → parse imported file → assert all key `SaveState` fields (`deathHistory`, `invalidated`, `gold`, `currentLocation`, `party` length) match the original exactly.

### Implementation

- [X] T063 [US4] Implement `src/modules/save/Serialiser.ts`
- [X] T064 [US4] Implement `src/modules/save/Migrator.ts`
- [X] T065 [US4] Implement `src/modules/save/IndexedDbStore.ts`
- [X] T066 [US4] Implement `src/modules/save/FileExporter.ts`
- [X] T067 [US4] Implement auto-save in `src/modules/save/` (event-driven, roguelike only — integrated into WorldMap.ts)
- [X] T068 [US4] Assemble `src/modules/save/index.ts`
- [X] T069 [US4] Add Save / Load UI to `src/game/scenes/MainMenu.ts`
- [X] T070 [US4] Add Save Game / auto-save to `WorldMap.ts` HUD

**Checkpoint**: US4 complete. Tests T059–T062 pass. Full save/load/export/import cycle works.

---

## Phase 7: User Story 5 — Casual vs. Roguelike Mode Distinction (Priority: P5)

**Goal**: Mode label always visible on HUD. Both modes: run ends immediately when the **PC or Escort dies**; all characters become `status: 'dead'` at 0 HP. Mode difference is save behavior only — Casual allows reloading any prior save (including to undo PC/Escort death); Roguelike permanently invalidates the save (`invalidated: true`) on PC/Escort death. Mode is clearly labeled throughout the UI.

**Independent Test**: Start Casual run → kill the **Escort** → run-end screen appears (mission failed). Reload save → Escort alive again (save-scumming permitted). Start Roguelike run → kill the **PC** → run-end screen appears AND save is marked invalidated (no reload path). Mode label visible in both flows.

### TDD — Write Tests First

- [ ] T071 [P] [US5] Write unit tests for mode enforcement in `tests/unit/combat/mode-enforcement.test.ts`: (a) PC dies in Casual → `checkRunEnd` returns `true`; (b) Escort dies in Casual → `checkRunEnd` returns `true`; (c) Adventurer dies in Casual → `checkRunEnd` returns `false`; (d) PC dies in Roguelike → `checkRunEnd` returns `true`; (e) Adventurer dies in Roguelike → `checkRunEnd` returns `false`. **All characters are `status: 'dead'` at 0 HP in both modes — no `incapacitated` assertions. Scope: integration-level — full party state → `RunEndDetector` → run-end result. Do NOT duplicate `ModeRules.ts` pure-function assertions covered in T039.**
- [ ] T072 [P] [US5] Write Playwright e2e test `tests/e2e/mode-distinction.spec.ts`: verify "CASUAL" or "ROGUELIKE" label visible on HUD after new game; verify character defeat outcome differs per mode.

### Implementation

- [ ] T073 [US5] Implement `src/modules/combat/RunEndDetector.ts`: `checkRunEnd(party: Character[]): boolean` — returns `true` if any character with `role === 'pc'` OR `role === 'escort'` has `status === 'dead'`. This applies in **both Casual and Roguelike modes** — mode does NOT change the run-end condition, only save behavior. Pure function. No `mode` parameter needed.
- [ ] T073a [US5] Implement save invalidation in `src/modules/combat/RunEndDetector.ts`: `invalidateSave(saveState: SaveState, mode: GameMode): SaveState` — returns updated `SaveState` with `invalidated: true` if and only if `mode.type === 'roguelike'`. Called by `Combat.ts` after `checkRunEnd()` returns `true`. Pure function.
- [ ] T074 [US5] Create `src/game/ui/ModeLabel.ts`: persistent HUD badge ("CASUAL" green / "ROGUELIKE" red); rendered as Tailwind HTML overlay; always `pointer-events-none`; mounted at game start and never removed.
- [ ] T075 [US5] Create `src/game/scenes/RunEnd.ts` Phaser scene: shown when `RunEndDetector.checkRunEnd()` returns `true` in **either mode**; displays reason ("Journey Over" if PC died, "Mission Failed" if Escort died); shows run summary (turns survived, enemies defeated, party roster, `deathHistory`); "Return to Menu" button.
- [ ] T076 [US5] Wire `Combat.ts` to call `checkRunEnd()` after each character's HP reaches 0; if `true`, call `invalidateSave()` to mark save state accordingly, then launch `RunEnd` scene. This applies in **both modes** — Casual players return to menu and may load a prior save from there; Roguelike players see no load option (save is `invalidated`).
- [ ] T077 [US5] Enforce Casual save-anywhere vs. Roguelike auto-save-only in `WorldMap.ts`: gate manual save button visibility on `gameMode === 'casual'`.

**Checkpoint**: US5 complete. Tests T071–T072 pass. PC/Escort death triggers run-end screen in both modes. Roguelike save is invalidated; Casual players can reload from main menu.

---

## Phase 8: Recruitment (Cross-Cutting — supports US1 party growth)

**Goal**: Player can hire characters at Towns (level 1, from hire pool). Rare mid-combat NPC rescue (<10% chance). Party grows from 2 to max 8.

**Note**: Recruitment spans the world map (town visits, US1) and combat (rare rescue, US2) so is implemented after both are stable.

### TDD — Write Tests First

- [X] T078 [P] Write unit tests for `RecruitmentModule` in `tests/unit/recruitment/recruitment.test.ts`: `getHirePool(town)` returns `hirePool`; `hireCharacter(hero, party, 25)` → `{ character: Character, goldAfter: 5 }` (asserts deduction = `hero.hireCost`, not a hardcoded value) when party has room and gold ≥ `hero.hireCost`; `hireCharacter(hero, fullParty, 20)` → `{ error: 'party-full' }` (return-value check — NOT a thrown exception); `hireCharacter(hero, party, 0)` → `{ error: 'insufficient-gold' }`; `rollRecruitmentEncounter(combat, prng)` returns event <10% of the time.
- [X] T078a [P] Write unit tests for `GoldRewardCalculator` in `tests/unit/combat/gold-reward.test.ts`: `killReward(enemy, prng)` with a fixed-seed `PRNG` instance returns a deterministic value matching `Math.floor(enemy.level × enemy.tier × (1 + prng.next()))`; verify Tier 1/2/3 enemy produces proportionally scaled rewards; `campClearBonus(enemies)` returns `Math.floor(avgLevel × 5)` for a known set; seeded reproducibility — same seed + same enemy always returns same reward.

### Implementation

- [X] T079 Implement `src/modules/recruitment/TownService.ts`: `getHirePool(town: Town): HireableHero[]`, `hireCharacter(hero: HireableHero, party: Character[], currentGold: number): { character: Character; goldAfter: number } | { error: 'party-full' | 'insufficient-gold' }` — validates party cap and gold balance; hero `hireCost` is always 20 gold (set when generating `HireableHero` templates); converts template to full `Character` with `role: 'adventurer'` and `recruitmentSource: 'hired'`.
- [X] T079a [P] Implement `src/modules/combat/GoldRewardCalculator.ts`: pure functions — `killReward(enemy: EnemyUnit, prng: PRNG): number` = `Math.floor(enemy.level * enemy.tier * (1 + prng.next()))` (seeded PRNG — deterministic and testable); `campClearBonus(enemies: EnemyUnit[]): number` = `Math.floor(avgLevel(enemies) * 5)`. Both functions accept no Phaser or global state. Called by `Combat.ts` after each unit-defeated event and on camp clear. Returns gold delta to be added to `SaveState.gold`. **Starting gold**: `SaveState.gold` initialises to 20 at run start (set in `WorldMap.ts` T034).
- [X] T080 Implement `src/modules/recruitment/EncounterTrigger.ts`: `rollRecruitmentEncounter(encounter: CombatEncounter, unitLookup: Record<string, EnemyUnit>, prng: PRNG): RecruitmentEvent | null` — rolls prng < 0.1; if triggered, selects a random ID from `encounter.friendlyNpcs` (`string[]`), resolves it to the full `EnemyUnit` via `unitLookup[id]`, then constructs and returns the `RecruitmentEvent`. (`CombatEncounter` stores only id arrays; callers pass the lookup map.) The friendly NPC's level MUST be `clamp(averagePartyLevel + 2, 3, 15)` (FR-012b).
- [X] T080a Implement friendly NPC AI in `src/modules/recruitment/FriendlyNpcAi.ts`: `takeTurn(npc: EnemyUnit, encounter: CombatEncounter, hexGrid: HexGridModule): void` — simple AI (move toward nearest enemy, attack if in range); NPC unit MUST be registered in `PhaseManager` as a third-party actor, excluded from `getPlayerControllableUnits()`. Satisfies FR-012c.
- [X] T081 Assemble `src/modules/recruitment/index.ts`: export `createRecruitmentModule(): RecruitmentModule` satisfying `contracts/recruitment.contract.md`.
- [X] T082 Create `src/game/ui/TownPanel.ts`: Tailwind HTML overlay; renders `HireableHero[]` list with name, class, level, and hire cost; "Hire" button calls `hireCharacter()` and updates party HUD; disables hire button when `party.length >= 8` and shows "Party Full" label. (FR-012a)
- [X] T082a Wire `WorldMap.ts` to show `TownPanel` when player moves onto a town tile; dismiss panel on exit or hire.
- [X] T083 Wire `Combat.ts` to call `rollRecruitmentEncounter()` at combat start; if event fires, show recruitment offer overlay and add character to party on accept; register NPC with `FriendlyNpcAi` for that encounter's Enemy Phase.

**Checkpoint**: Recruitment complete. Town hire and rare encounter rescue both work in browser.

---

## Phase 9: MetaProgressionModule Stub (Constitution Principle IV)

**Goal**: Satisfy Principle IV — provide the extension point stub so future meta-progression can be added without architectural change.

- [X] T084 Implement `src/modules/meta-progression/index.ts`: export `createMetaProgressionModule(): MetaProgressionModule` returning `{ schemaVersion: 1 }`. No logic. Stub only.
- [X] T085 Include `MetaProgressionModule` instance in `SaveState` serialisation (`Serialiser.ts`) so the field is present in all saved files from day one.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final wiring, UX completeness, and validation run.

- [X] T086 [P] Add error boundary to `FileExporter.importFromFile()`: if `SaveStateSchema.safeParse()` fails, display user-facing toast "Save file is incompatible or corrupted" via a Tailwind toast component (`src/game/ui/Toast.ts`).
- [X] T087 [P] Add storage-quota guard to `IndexedDbStore.save()`: catch `QuotaExceededError`, surface toast "Browser storage full — export your save file".
- [X] T088 [P] Add stacking guard to `HexGridStore.moveOccupant()`: reject move if `tile.occupants.length >= 8`; emit `move:rejected` event.
- [X] T089 [P] Validate all Phaser scenes clean up event listeners and module references in their `shutdown` lifecycle hook to prevent memory leaks across scene transitions.
- [X] T090 Run `quickstart.md` validation checklist end-to-end: scaffold → install → dev server → unit tests pass → e2e tests pass → production build succeeds (`npm run build`).
- [X] T091 [P] Verify `npm run build` produces a bundle with Phaser in its own chunk (`phaser.[hash].js`) and total initial JS < 500 KB (excluding Phaser chunk).
- [X] T092 [P] Manual smoke test matrix: Chrome, Firefox, Edge — new game → combat → level up → save → load → export → import → run end (Roguelike).
- [X] T093 [P] Write Playwright timing tests for success criteria: SC-001, SC-002, SC-003
- [X] T093a [P] Write Playwright frame-time guard (`tests/e2e/perf-frametime.spec.ts`)
- [X] T094 [P] Create `src/data/palette.ts`: export `FANTASY_PALETTE` const with 8 named hex color values (earth tones, forest greens, stone greys, parchment). Add a comment block referencing FR-016 tone guidelines (medieval, pre-industrial, nature-focused). Import and use in `Boot.ts` for placeholder 32×32 colored tile generation until production art assets are provided.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └─► Phase 2 (Foundational) ─ BLOCKS ALL ─┐
                                             ├─► Phase 3 (US1 — MVP) ──────────────────────────────►┐
                                             ├─► Phase 3 complete ──► Phase 4 (US2) ────────────────►┤
                                             └─► Phase 3+4 complete ► Phase 5 (US3)                  │
                                                                     Phase 4 complete ► Phase 6 (US4) │
                                                                     Phase 3+4 complete ► Phase 7 (US5)│
                                                                     Phase 3+4 complete ► Phase 8 (Recruitment)
                                                                     Phase 2 complete ► Phase 9 (Stub) │
                                                                     All phases ──────────────────────► Phase 10 (Polish)
```

### Critical Path (MVP)

**Phase 1 → Phase 2 → Phase 3** — delivers a playable game. Everything after extends it.

### Parallel Opportunities Per Phase

| Phase | Parallelizable task groups |
|---|---|
| Phase 1 | T002+T003 together; T007+T008 together |
| Phase 2 | T013+T014+T015 together; T016+T017+T018+T019 together; T012 alongside models |
| Phase 3 | T020+T021+T022+T023 together (test writing); T024+T025 together (independent modules) |
| Phase 4 | T037+T038+T039+T040 together; T041+T042+T043+T044 together |
| Phase 5 | T050+T051 together |
| Phase 6 | T059+T060+T061+T062 together; T063+T064+T065+T066+T067 together |
| Phase 7 | T071+T072 together |
| Phase 8 | T078 + T078a together (TDD group); other tasks sequential |
| Phase 10 | T086+T087+T088+T089+T091+T092 together |

---

## Implementation Strategy

### MVP Scope (Phase 1 → 3 only)

Deliver a browser-runnable game where a player can:
1. Open the game and choose a mode
2. Navigate a procedurally generated hex map with a party of 2 characters
3. View stat blocks

**This alone satisfies Constitution Principle I.**

### Incremental Delivery

| Milestone | Phases | Delivers |
|---|---|---|
| MVP | 1–3 | Playable hex map + movement |
| Combat | + 4 | Full tactical encounter loop |
| Progression | + 5 | Levelling + class evolution |
| Persistence | + 6 | Save / load / export / import |
| Mode depth | + 7 | Full Casual vs. Roguelike distinction |
| Party growth | + 8 | Recruitment at towns + rare encounters |
| Architecture | + 9 | MetaProgressionModule stub |
| Shippable | + 10 | Polish + validated |

---

## Task Count Summary

| Phase | Tasks | User Story |
|---|---|---|
| Phase 1: Setup | T001–T009 (9 tasks) | — |
| Phase 2: Foundational | T010–T019 (10 tasks) | — |
| Phase 3: US1 hex map | T020–T036 (17 tasks) | US1 (P1) |
| Phase 4: US2 combat | T037–T049 + T045a (14 tasks) | US2 (P2) |
| Phase 5: US3 progression | T050–T058 + T057a (10 tasks) | US3 (P3) |
| Phase 6: US4 save | T059–T070 (12 tasks) | US4 (P4) |
| Phase 7: US5 modes | T071–T077 + T073a (8 tasks) | US5 (P5) |
| Phase 8: Recruitment | T078–T083 + T078a + T079a (8 tasks) | cross-cutting |
| Phase 9: Stub | T084–T085 (2 tasks) | — |
| Phase 10: Polish | T086–T094 + T093a (10 tasks) | — |
| **Total** | **98 tasks** | |
