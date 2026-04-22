# Implementation Plan: World Map Terrain Detail

**Branch**: `004-world-map-detail` | **Date**: 2026-04-22 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/004-world-map-detail/spec.md`

## Summary

Replace the flat world-map presentation with terrain-specific tile art, a hex footprint that is exactly 2x the current size, and lightweight two-step ambient animation, while keeping the current party marker readable as a yellow circle on top of the map. The implementation will stay inside the existing `WorldMap` scene and `src/modules/world-map/` helpers, reuse the current terrain data already generated for each hex, and avoid save/schema changes so the feature remains presentation-only. The main performance guard is to keep animation deterministic and cheap: per-tile phase offsets, no per-tile tween objects, and no frame-by-frame `Graphics` redraws.

## Technical Context

**Language/Version**: TypeScript 6.0.x (strict mode)  
**Primary Dependencies**: Phaser 4.0.0, Vite 8, Vitest 4, Playwright 1.59, zod  
**Storage**: N/A for this feature; no new persistent state is required  
**Testing**: Vitest unit tests and Playwright e2e/perf tests  
**Target Platform**: Modern desktop browsers in the existing browser game shell  
**Project Type**: Browser game / single-page app  
**Performance Goals**: Keep the world map at the existing 60 fps target; tile animation should not introduce a measurable steady-state regression beyond the existing perf budget  
**Constraints**: Preserve the current yellow party marker, keep Fog of War out of scope, keep save/load compatibility unchanged, and account for a 2x tile footprint in camera/bounds/layout calculations  
**Scale/Scope**: One `WorldMap` scene rendering roughly 1,200 hex tiles plus the party marker and existing overlays

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simple & Playable First | ✅ PASS | The first slice is purely visual and keeps the current map playable; no new gameplay systems are introduced. |
| II. Test-Driven Development | ✅ PASS | The implementation plan is driven by unit tests for the tile presentation logic and Playwright checks for the world-map scene and performance. |
| III. Component/Module Separation | ✅ PASS | Tile presentation behavior stays in the world-map scene and `src/modules/world-map/` helpers, separate from save, combat, and pathfinding logic. |
| IV. Composability & Reusability | ✅ PASS | Animation timing and tile-state selection are deterministic helpers that can be reused by other scenes or future tile art work. |
| V. All Features are Built from `main` | ✅ PASS | Branch `004-world-map-detail` is created from `main`, matching the repository constitution. |

**No gate violations.**

## Project Structure

### Documentation (this feature)

```text
specs/004-world-map-detail/
├── plan.md           # This file
├── research.md       # Phase 0 output
├── data-model.md     # Phase 1 output
├── quickstart.md     # Phase 1 output
└── checklists/
    └── requirements.md
```

### Source Code

```text
src/
├── game/
│   └── scenes/
│       ├── Boot.ts                 ← generate/register terrain textures or variants
│       └── WorldMap.ts             ← render terrain art, animate tiles, keep party marker readable
└── modules/
    └── world-map/
        ├── TilePresentation.ts     ← NEW: terrain frame selection and 2x-footprint helpers
        ├── CombatReturnState.ts
        ├── DeathMarkerStore.ts
        ├── HoverPreviewThrottle.ts
        ├── PartyMovementPlanner.ts
        ├── TurnBudgetManager.ts
        └── index.ts                ← re-export world-map helper modules

tests/
├── unit/
│   └── world-map/
│       ├── DeathMarkerStore.test.ts
│       ├── HoverPreviewThrottle.test.ts
│       ├── TurnBudgetManager.test.ts
│       ├── death-handling.test.ts
│       └── party-movement.test.ts
└── e2e/
    ├── smoke.spec.ts               ← scene loads and the map remains readable
    └── perf-frametime.spec.ts      ← regressions in render cost / animation cost
```

**Structure Decision**: Single-project layout, with the feature implemented as an additive change to the existing `WorldMap` scene plus small helpers under `src/modules/world-map/`. No new external interface is introduced, so a `contracts/` directory is not required for this feature.

## Phase 0 Research Summary

See [research.md](research.md) for the decision log. Key decisions:

| ID | Decision |
|----|----------|
| R-001 | Use a lightweight per-tile animation clock with slight phase offsets, not a synchronized global wave. |
| R-002 | Keep tile animation render-time only and avoid per-tile tweens or frame-by-frame vector redraws. |
| R-003 | Preserve the party marker as a separate higher-depth overlay so it stays readable over terrain art. |
| R-004 | Reuse existing terrain identity data already present on each `HexTile`; do not change save/schema formats. |
| R-005 | Validate the feature with unit tests plus Playwright smoke and performance coverage. |
| R-006 | Double the hex footprint from the current world-map size so terrain art has more space to read. |

## Phase 1 Design Summary

See [data-model.md](data-model.md) for the runtime presentation model and state transitions.

### Runtime Presentation Interface

The feature does not add a new persisted domain model. Instead, it introduces a small scene-local presentation layer:

- each visible hex gets a deterministic terrain frame state
- each visible hex gets exactly twice the current on-screen footprint, leaving room for terrain details
- the state toggles between two visual variants on a tile-specific cycle
- the party marker remains a separate overlay anchored to the occupied hex

### WorldMap.ts Integration Points

1. **`Boot.ts`** - provide terrain texture variants or frame keys for the two-step animation without introducing heavy runtime generation.
2. **`WorldMap.ts:create()`** - build the tile presentation layer after the map is generated or restored.
3. **`WorldMap.ts:renderMap()`** - render terrain art instead of a flat fill and assign tile-specific animation offsets.
4. **`WorldMap.ts:renderParty()`** - keep the party marker centered on the occupied tile and above tile art.
5. **`WorldMap.ts:update()`** - advance the ambient animation using scene time, with no per-tile tween allocation.
6. **Tile sizing / layout calculations** - update the scene's tile-size assumptions, hit areas, and bounds calculations so the 2x hex footprint fits correctly on the grid.

### Constitution Re-Check (Post-Design)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simple & Playable First | ✅ PASS | The design is presentation-only and preserves the existing map flow. |
| II. Test-Driven Development | ✅ PASS | Unit and e2e/perf validation are specified before implementation work starts. |
| III. Component/Module Separation | ✅ PASS | Presentation logic stays isolated from save and movement logic. |
| IV. Composability & Reusability | ✅ PASS | The tile animation approach is deterministic and reusable. |
| V. All Features are Built from `main` | ✅ PASS | No branch or workflow change required. |

**No gate violations post-design.**
