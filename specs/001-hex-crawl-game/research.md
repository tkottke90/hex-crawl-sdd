# Research: Hex Crawl Game — Core Experience

**Branch**: `001-hex-crawl-game` | **Date**: 2026-04-21  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## R-001: Project Scaffolding — Phaser 3 + Vite + TypeScript + Tailwind v4

**Decision**: Use the official [`phaserjs/template-vite-ts`](https://github.com/phaserjs/template-vite-ts) as the base scaffold. Add TailwindCSS v4 via `@tailwindcss/vite` plugin (no PostCSS config needed). Add Zod for runtime validation.

**Rationale**: Maintained by Phaser Studio. Ships with the correct `manualChunks: { phaser: ['phaser'] }` Vite config — essential to prevent the ~1MB Phaser bundle from blocking initial load. Tracks Vite 6, TS 5.7.

**Alternatives Considered**: `phaser3-parcel-template` — slower HMR, less maintained. Custom Webpack — too much config overhead for a POC.

**Key Pitfalls**:
- Delete `log.js` / remove analytics call from `package.json` scripts if unwanted telemetry is a concern.
- Full-page HMR reloads are expected; Phaser cannot hot-reload individual scenes.
- Set `"strictPropertyInitialization": false` in `tsconfig.json` — Phaser scenes assign members in `create()`, not the constructor.

---

## R-002: TailwindCSS v4 + Phaser Canvas Integration

**Decision**: Tailwind styles HTML overlays only (menus, HUD, modals). Phaser owns `<canvas>` entirely.

```html
<div id="game-container" class="relative w-full h-full">
  <canvas id="phaser-canvas"></canvas>
  <div class="absolute top-0 left-0 pointer-events-none ...">HUD</div>
</div>
```

**Rationale**: v4 first-party Vite plugin (`@tailwindcss/vite`) — no PostCSS config. CSS-first config via `@theme {}` replaces `tailwind.config.js`.

**Alternatives Considered**: UnoCSS — compatible but less documentation for this stack. PostCSS approach — extra boilerplate.

**Key Pitfalls**: Always set `pointer-events-none` on passive overlays; use `pointer-events-auto` only on interactive HTML UI elements to avoid intercepting Phaser's input.

---

## R-003: Hex Grid Coordinate System

**Decision**: Cube coordinates `{ q: number, r: number, s: number }` (`s = -q - r` invariant always enforced) as the canonical internal representation.

**Rationale**: Cube coords are the most explicit form: all three axes are always present, making neighbor/distance/rotation algorithms trivially symmetric. The invariant `q + r + s === 0` can be asserted at construction time, catching bugs at the boundary rather than deep in pathfinding logic. Red Blob Games recommends cube coords as the cleanest representation for complex hex math. Axial `{q,r}` stores the same information and `s` is technically derivable, but carrying `s` explicitly eliminates the recomputation and makes intent clear.

**Alternatives Considered**: Axial `{q, r}` — equivalent storage, slightly less clear (s implicit). Offset coordinates (`odd-r` / `even-r`) — require parity-dependent lookup tables; only appropriate for simple rectangular maps with no pathfinding.

---

## R-004: Hex Tile Rendering in Phaser

**Decision**: Phaser's built-in Tilemap with hexagonal/staggered orientation for static terrain layers (authored in Tiled editor, exported as JSON). Dynamic content (unit sprites, fog of war, highlight overlays) placed as `GameObject` overlays at hex centers.

**Rationale**: Phaser 3.60+ has native hex tilemap support. Tiled exports a `staggered` hex map format. This gives free culling, camera handling, and tile layer management without reimplementing those systems.

**Alternatives Considered**: Fully manual rendering with `Graphics` per hex — flexible, but re-implements culling/batching. Only warranted if hex geometry is non-standard.

---

## R-005: Procedural Map Generation

**Decision**: Two-field fractal noise (elevation + moisture) → biome lookup table, with island shaping. Library: `simplex-noise` (TypeScript-native, seedable via custom PRNG).

**Rationale**: Produces credible world maps in ~50 lines of logic. Elevation + moisture → biome grid covers ocean, beach, grassland, forest, desert, snow, mountain. Island shaping (`e = lerp(e, 1-d, mix)`) keeps ocean at map edges for a natural landmass feel. Seedable PRNG means a seed value produces a reproducible map for debugging and (future) seed sharing.

**Biome assignment**: 2D lookup table on `(elevation, moisture)`.

**Alternatives Considered**: Voronoi/Poisson polygon maps — ~5× more complex, overkill for v1. `FastNoiseLite` JS port — useful if more exotic terrain types are needed later.

---

## R-006: Hex Pathfinding

**Decision**: Custom A\* implemented directly on cube coordinates. `cube_distance` (= `max(|q|,|r|,|s|)`) as heuristic; `hex_neighbors` for adjacency. Binary heap priority queue.

**Rationale**: Pathfinding on hex grids is structurally identical to square grids; no special library needed. Movement range (BFS/Dijkstra from unit position up to move budget) is a separate lighter operation. Both are <100 lines of code.

**Alternatives Considered**: `ngraph.path` — generic graph pathfinding, adaptable. Overkill for a deterministic hex grid. BFS alone — sufficient for movement range display, not for optimal path to a specific tile.

---

## R-007: Local Save — Browser Storage

**Decision**: IndexedDB via the `idb` npm wrapper (~1KB).

**Rationale**: `localStorage` is synchronous (blocks main thread), capped at ~5MB, and stores strings only. A party-of-8 + world map save JSON can approach that limit. IndexedDB is async, stores structured objects natively, and has quota in the hundreds of MB range.

**Alternatives Considered**: `localforage` — heavier wrapper, similar API. `localStorage` — acceptable only for tiny demo save data.

---

## R-008: Versioned Save File Schema

**Decision**: Embed `version: number` at the root of every save. Apply sequential pure-function migrations before Zod validation. Maintain one current-version Zod schema; all imported saves are migrated to that version first.

**Migration pattern**:
```typescript
const MIGRATIONS: Record<number, (d: unknown) => unknown> = {
  1: (d: any) => ({ ...d, version: 2, newField: null }),
};
function migrate(data: unknown): CurrentSaveFile {
  let d: any = data;
  while (d.version < CURRENT_VERSION) d = MIGRATIONS[d.version](d);
  return d;
}
```

**Rationale**: Simple, testable (each migration is a pure function), and co-located with the schema. Each migration is independently unit-testable.

**Alternatives Considered**: `zod-migration` library — overkill for this use case. JSON Schema `$schema` versioning — adds overhead without benefit for local-only saves.

---

## R-009: Save File Export/Import

**Decision**: `URL.createObjectURL` + programmatic `<a>` click for export. `FileReader` API for import.

**Rationale**: No dependencies, universal modern browser support. Works within Phaser game context without a backend. File System Access API (`showSaveFilePicker`) is more ergonomic but lacks Firefox support as of 2026.

**Alternatives Considered**: File System Access API — better UX if Safari/Firefox support improves; defer to a later version.

---

## R-010: Zod Validation for Save Import

**Decision**: `z.safeParse()` after migration. Define a single schema for the current version. Infer TypeScript types from the schema (`z.infer<typeof Schema>`).

```typescript
const result = CurrentSaveSchema.safeParse(migrated);
if (!result.success) throw new InvalidSaveError(result.error);
return result.data; // fully typed
```

**Rationale**: Validates user-supplied data at the system boundary (FR spec requirement). `safeParse` gives structured error info without thrown exceptions. Type inference eliminates a separate type declaration.

**Alternatives Considered**: Manual type guards — verbose, error-prone. `valibot` — lighter bundle, similar API; viable swap if bundle size becomes a concern.
