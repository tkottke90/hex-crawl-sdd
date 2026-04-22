# Implementation Plan: Random Map Generation

**Branch**: `005-random-map-generation` | **Date**: 2026-04-22 | **Spec**: [specs/005-random-map-generation/spec.md](spec.md)
**Input**: Feature specification from `specs/005-random-map-generation/spec.md`

## Summary

Every new game generates a unique map via a timestamp+random seed. The outer two tile-layers of the map grid are forced to impassable ocean. The player always starts within the bottom half and center horizontal half of the map. A card-style HUD element (`SeedInfoCard`) replaces the existing `ModeLabel` pill and displays both the game mode and the current seed — styled consistently with the `StatPanel` character card.

**Technical approach**: Pure post-processing additions to the existing `generateMap` function in `src/modules/hex-grid/MapGenerator.ts`; a new `SeedInfoCard` UI class replaces `ModeLabel` in `WorldMap.ts`. No model changes, no new dependencies.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: simplex-noise (via `createNoise2D`), Phaser 4.0.0, Tailwind CSS (utility classes)
**Storage**: `WorldMap.seed` persisted in `SaveState.worldMap` (already in place — no schema changes)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Browser — modern evergreen (Chrome, Firefox, Safari, Edge latest 2)
**Project Type**: Browser game (single project)
**Performance Goals**: Stable 60 fps; map generation is a one-shot startup cost (<50ms for 40×30 grid)
**Constraints**: No new npm packages; no model schema changes; full backward-compat with existing save files
**Scale/Scope**: 40×30 map grid (1,200 tiles); 4 source files touched or created; ~6 new unit tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I — Simple & Playable First | ✅ PASS | Changes are additive post-processing steps; game remains fully playable. No speculative complexity. |
| II — Test-Driven Development | ✅ PASS | New tests planned: water border coverage, start region constraints, seed uniqueness, `SeedInfoCard` render. Tests written before implementation. |
| III — Component/Module Separation | ✅ PASS | Border logic stays inside `MapGenerator.ts` (hex-grid module). `SeedInfoCard` is an isolated UI class. No cross-module internals accessed. |
| IV — Composability & Reusability | ✅ PASS | `generateMap` remains a pure function with the same signature. `SeedInfoCard` has a minimal constructor/destroy lifecycle API. |
| V — All Features from `main` | ✅ PASS | Branch `005-random-map-generation` was cut from `main`. |

**Post-design re-check**: No violations introduced. Architecture does not require complexity justification.

## Project Structure

### Documentation (this feature)

```text
specs/005-random-map-generation/
├── plan.md                          # This file
├── spec.md                          # Feature specification
├── research.md                      # Phase 0 decisions
├── data-model.md                    # Entity + behavior design
├── contracts/
│   └── map-generator.contract.md   # generateMap postconditions
└── tasks.md                         # Phase 2 output (speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── modules/
│   └── hex-grid/
│       └── MapGenerator.ts         # MODIFY: border post-process + start region selection
├── game/
│   ├── scenes/
│   │   └── WorldMap.ts             # MODIFY: seed generation, use SeedInfoCard, remove ModeLabel
│   └── ui/
│       ├── ModeLabel.ts            # KEEP as-is (may be used elsewhere)
│       └── SeedInfoCard.ts         # NEW: card HUD showing mode + seed

tests/
└── unit/
    ├── hex-grid/
    │   └── map-gen.test.ts         # MODIFY: add border + start region tests
    └── world-map/
        └── seed-info-card.test.ts  # NEW: SeedInfoCard DOM render + destroy tests
```

**Structure Decision**: Single-project TypeScript browser game. All changes are surface-local — one module (`hex-grid/MapGenerator`), one scene (`WorldMap`), one new UI class (`SeedInfoCard`), and two test files.

## Implementation Phases

### Phase D — Tests *(written FIRST — Red phase before each implementation phase)*

> **Constitution Principle II**: Tests MUST be written and failing before any implementation begins. See `tasks.md` for the exact TDD order — test tasks always precede their paired implementation tasks within each user story.

| Test file | Test description | Covers | Written before |
|-----------|-----------------|--------|---------------|
| `map-gen.test.ts` | Two calls with distinct base-36 seeds produce different maps | FR-001, SC-001 | Phase A item 6 / T002 |
| `map-gen.test.ts` | All border tiles are ocean + impassable for any seed | FR-002, SC-002 | Phase A items 1, 3 |
| `map-gen.test.ts` | `playerStartCoord` is in bottom half + center half | FR-004, SC-003 | Phase A items 2, 4 |
| `map-gen.test.ts` | `playerStartCoord` tile is passable after border override | FR-003, FR-005 | Phase A item 3 |
| `seed-info-card.test.ts` | Renders a DOM element with the seed value | FR-007, SC-005 | Phase B |
| `seed-info-card.test.ts` | `destroy()` removes the element from DOM | FR-007 | Phase B |

### Phase A — `MapGenerator` changes (FR-001 through FR-006)

1. Add `isBorderTile(coord, width, height)` pure helper.
2. Add `isInStartRegion(coord, width, height)` pure helper.
3. After tile generation loop: post-process border tiles → `terrain: 'ocean'`, `passable: false`.
4. After border post-process: collect start-region candidates, pick tile minimizing distance to `(width/2, height-1)` in column/row space; fallback: force center-bottom tile to grassland. Set `playerStartCoord` from the result.
5. Update seed generation in `WorldMap.ts`: `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}` — base-36 encodes the timestamp so the seed looks like a random character string (e.g., `lrno8owk3x7mq2p`).

### Phase B — `SeedInfoCard` UI (FR-007)

1. Create `src/game/ui/SeedInfoCard.ts`.
   - Constructor: `(mode: GameModeType, seed: string)` — appends card DOM element fixed top-right.
   - `destroy()`: removes DOM element.
   - Styling: `bg-gray-900/90 border border-gray-600 rounded-xl p-4 w-56 pointer-events-none z-50` matching `StatPanel`.
   - Content: mode color-pill (green=casual, red=roguelike) + "SEED" label + seed value in monospace.
   - Note: `z-50` is intentionally below any full-screen overlays (`DiceRollOverlay`, `LevelUpOverlay`) which use higher z-values; the card may be obscured by overlays when they are active, which is acceptable.

### Phase C — `WorldMap.ts` integration

1. Replace `ModeLabel` import/field/instantiation with `SeedInfoCard`.
2. In `create()`: instantiate `SeedInfoCard(mode, seed)` after `generateMap` call.
3. In `restoreFromSave()`: instantiate `SeedInfoCard(saveState.gameMode.type, saveState.worldMap.seed)` — covers both initial load and combat-return (`worldMapTurnRefresh`) paths.
4. In shutdown/destroy: call `seedInfoCard.destroy()`.

## Complexity Tracking

*No constitution violations — section not applicable.*
