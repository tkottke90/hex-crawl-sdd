# Implementation Plan: Hex Crawl Game — Core Experience

**Branch**: `001-hex-crawl-game` | **Date**: 2026-04-21 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/001-hex-crawl-game/spec.md`

---

## Summary

Build a local-first, browser-only hex crawl game using PhaserJS 3, TypeScript (strict), Vite, TailwindCSS v4, and Zod. The game features a fully procedurally generated hex world map, Fire Emblem-inspired phase-based tactical combat with visible D&D-style dice rolls, a growing party of 2–8 characters with class evolution, two game modes (Casual / Roguelike with permadeath), and a save system supporting both browser storage (IndexedDB) and device file export/import.

The architecture is module-separated (Constitution Principles III & IV): `HexGridModule`, `CombatModule`, `ProgressionModule`, `SaveModule`, `RecruitmentModule`, and a `MetaProgressionModule` stub each expose a typed interface contract; no module references another's internals.

---

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode; `strictPropertyInitialization: false`)  
**Primary Dependencies**: Phaser 3 (renderer + input), Vite 6 (bundle + dev), TailwindCSS v4 (HTML overlays), Zod (save validation), `idb` (IndexedDB wrapper), `simplex-noise` (procedural map)  
**Storage**: IndexedDB (in-browser saves via `idb`); device file system via `Blob` + `FileReader` API  
**Testing**: Vitest (unit, with `@vitest/coverage-v8`) + Playwright (e2e)  
**Target Platform**: Desktop browser — Chrome, Firefox, Edge, Safari (latest 2 versions); no server  
**Project Type**: Browser game (single-page, local-first, no backend)  
**Performance Goals**: Stable 60 fps during world-map navigation and combat; dice roll result visible ≤500 ms post-action  
**Constraints**: Fully offline-capable; no login, no network calls; save exports are human-readable versioned JSON  
**Scale/Scope**: Single-player; party 2–8; world map procedurally generated per run; desktop browser only (v1)

## Constitution Check

*GATE: Must pass before implementation begins. Re-evaluated post-design below.*

### Pre-Design Check (against Constitution v1.1.0)

| Principle | Check | Status |
|---|---|---|
| **I. Simple & Playable First** | US1 (hex map + movement) is the P1 slice. Each user story is independently playable before the next is built. No polish features are planned before the game loop exists. | ✅ PASS |
| **II. Test-Driven Development** | All module contracts are defined before implementation. TDD cycle (Red→Green→Refactor) is mandatory per tasks. Vitest unit tests + Playwright e2e tests required per story. | ✅ PASS |
| **III. Component/Module Separation** | HexGridModule, CombatModule, ProgressionModule, SaveModule, RecruitmentModule, MetaProgressionModule are independently defined with typed interface contracts. No cross-module internal references permitted. | ✅ PASS |
| **IV. Composability & Reusability** | MetaProgressionModule is a stub in v1 with a defined extension interface. DiceRoller, PRNG, and noise utilities are ignorant of game context. All features implemented as composable modules. | ✅ PASS |

### Post-Design Re-Check

| Principle | Design Decision | Status |
|---|---|---|
| **I.** | Tilemap + Phaser native camera satisfies v1 rendering, no premature optimisation. | ✅ PASS |
| **II.** | Zod schemas defined in `src/schemas/` mirror `src/models/` — schemas are testable independently. | ✅ PASS |
| **III.** | Contracts directory defines 6 module boundaries (including dedicated ProgressionModule); all inter-module communication flows through the contract interface. | ✅ PASS |
| **IV.** | `MetaProgressionModule` stub confirms the extension point pattern; `SaveModule` migration table is an independent composable function. | ✅ PASS |

**No violations. No complexity justifications required.**

---

## Project Structure

### Documentation (this feature)

```text
specs/001-hex-crawl-game/
├── plan.md              ← This file
├── research.md          ← Phase 0 complete
├── data-model.md        ← Phase 1 complete
├── quickstart.md        ← Phase 1 complete
├── contracts/
│   ├── README.md
│   ├── hex-grid.contract.md
│   ├── combat.contract.md
│   ├── progression.contract.md
│   ├── save.contract.md
│   ├── recruitment.contract.md
│   └── meta-progression.contract.md
└── tasks.md             ← Phase 2 complete
```

### Source Code (repository root)

```text
src/
├── main.ts                    # App entry: mounts Phaser game, imports Tailwind CSS
├── style.css                  # @import "tailwindcss"
├── game/
│   ├── main.ts                # Phaser Game config, scene registry
│   └── scenes/
│       ├── Boot.ts            # Asset registration
│       ├── Preloader.ts       # Progress bar, asset load
│       ├── MainMenu.ts        # Mode selection, load/new game
│       ├── WorldMap.ts        # Hex world navigation, town visits, encounter triggers
│       ├── Combat.ts          # Phase-based tactical combat, dice roll display
│       └── RunEnd.ts          # Roguelike run-end summary screen
├── modules/
│   ├── hex-grid/              # HexGridModule: coords, pathfinding, map access
│   ├── combat/                # CombatModule: phase management, AI, dice resolution
│   ├── progression/           # ProgressionModule: XP, level-up, class promotion
│   ├── save/                  # SaveModule: IndexedDB, file export/import, migration
│   ├── recruitment/           # RecruitmentModule: town hire, rare encounter trigger, NPC AI
│   └── meta-progression/      # MetaProgressionModule: v1 stub
├── models/                    # TypeScript interfaces (data-model.md)
├── schemas/                   # Zod schemas mirroring models/
├── data/
│   └── classes.ts             # ClassDefinition registry (base + promoted)
└── utils/
    ├── dice.ts                # DiceRoller: pure, no game context
    ├── prng.ts                # Seedable PRNG (xoshiro128**)
    └── noise.ts               # simplex-noise wrapper, normalised output

tests/
├── unit/
│   ├── utils/
│   ├── schemas/
│   ├── hex-grid/
│   ├── combat/
│   ├── progression/
│   ├── save/
│   └── recruitment/
└── e2e/
    ├── new-game.spec.ts
    ├── combat.spec.ts
    ├── save-load.spec.ts
    └── mode-distinction.spec.ts

public/
└── assets/
    ├── tilemaps/
    ├── tilesets/
    └── portraits/
```

**Structure Decision**: Single-project layout. No backend. All source under `src/`; modules are subdirectories of `src/modules/` with `index.ts` exporting only the public contract interface. Tests mirror source tree. ProgressionModule is a dedicated first-class module (not part of CombatModule) to satisfy Constitution Principle III.

---

## Key Technical Decisions

| Topic | Decision |
|---|---|
| Hex coordinates | Cube `{q,r,s}` — invariant `q+r+s=0` enforced at construction; `max(|Δq|,|Δr|,|Δs|)` distance for A* |
| Map generation | `simplex-noise` two-pass (elevation + moisture) → biome lookup; seeded PRNG per run |
| Phaser scaffold | Official `phaserjs/template-vite-ts`; Phaser in its own Vite chunk (`manualChunks`) |
| UI overlays | TailwindCSS v4 via `@tailwindcss/vite`; HTML overlays with `pointer-events-none` on passive elements |
| Save storage | IndexedDB via `idb`; versioned JSON with Zod parse on import |
| Pathfinding | Custom A* on cube coords; binary-heap priority queue |
| Progression | Dedicated `ProgressionModule` (`src/modules/progression/`); separated from `CombatModule` |
| Auto-save trigger | Event-driven: fires on `phase:enemyPhaseEnd` and `occupant:moved`; Roguelike mode only |
| Combat turn model | Phase-based (Fire Emblem): Player Phase → Enemy Phase; `actedThisPhase` flag per unit |
| Promotion threshold | Level 10 (fixed for v1); defined as `promotionLevel: 10` on each base `ClassDefinition` in `src/data/classes.ts`; configurable per class for future variants without architectural change |
| MetaProgression | v1 stub only; `MetaProgressionModule` interface reserved for future carry-over mechanics |
