# Research: Random Map Generation

**Branch**: `005-random-map-generation`  
**Date**: 2026-04-22  
**Purpose**: Resolve all technical unknowns before Phase 1 design begins.

---

## Decision 1 — Seed Uniqueness Strategy

**Question**: The current code uses `seed = \`run_${Date.now()}\``. Is a timestamp alone sufficient, and how should we improve it?

**Decision**: Base-36-encode the timestamp and concatenate a `Math.random()` suffix, also in base-36. Drop the `run_` prefix so the seed looks like a random character string.

```ts
const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
```

Example output: `lrno8owk3x7mq2p`

**Rationale**: `Date.now()` exposed directly looks like a number and makes the uniqueness strategy obvious; encoding it in base-36 makes the seed appear opaque and random to the user. A `Math.random()` suffix eliminates collision risk when two games start in the same millisecond (e.g., automated tests, rapid restarts). The full seed is still recoverable by decoding the base-36 prefix. No external PRNG is needed — only *map generation* needs to be deterministic for a given seed.

**Alternatives considered**:
- `crypto.randomUUID()` — too long and hyphenated; UUID format is awkward to display in the card. Rejected.
- Timestamp only — prone to collision in same-ms starts. Rejected as insufficient.
- `run_<timestamp>_<random>` — the `run_` prefix plus plaintext timestamp reveals implementation details and looks less polished in the UI. Rejected.

---

## Decision 2 — Water Border Override: Post-Processing vs In-Loop

**Question**: Should the forced water border be applied during the noise-generation loop or as a post-processing pass after all tiles exist?

**Decision**: Post-processing pass after all tiles are generated.

**Rationale**: Post-processing keeps the noise-generation logic unmodified and centralized. The border check is a pure coordinate comparison that runs in O(border tiles) time. Because MAP_WIDTH=40 and MAP_HEIGHT=30, the outer two layers comprise roughly `4 × 2 × (40 + 30)` ≈ 560 tiles out of 1200 — post-processing them takes negligible extra time. Separating the concern also makes the border logic independently testable.

**Alternatives considered**:
- In-loop override — saves one pass but intermixes border logic with biome logic. Rejected for readability and testability.
- Island shaping only (existing distance falloff) — not guaranteed; outer tiles can be non-ocean depending on seed. Rejected as non-deterministic.

---

## Decision 3 — Water Border: How to Identify "Outer Two Layers" in the Axial Grid

**Question**: The rectangular grid uses axial coordinates `(q, r, s)`. How do we identify the outer two column-layers when the culumn index `qi` is not stored on the tile?

**Decision**: Derive `qi` from stored tile coords at post-processing time using `qi = coord.q + Math.floor(coord.r / 2)`.

**Rationale**: In the generator loop, `q = qi - qOffset` and `qOffset = Math.floor(r / 2)`, so `qi = q + Math.floor(r / 2)`. The row index `r` maps directly to `coord.r`. Border condition:

```ts
function isBorderTile(coord: HexCoord, width: number, height: number): boolean {
  const qi = coord.q + Math.floor(coord.r / 2);
  return coord.r < 2 || coord.r >= height - 2 || qi < 2 || qi >= width - 2;
}
```

**Alternatives considered**:
- Store `qi` on `HexTile` — would require model change throughout the codebase. Rejected (YAGNI).
- Use cube-coordinate ring distance from corner — complex for a rectangular grid; axial column derivation is simpler and more direct. Rejected.

---

## Decision 4 — Player Start Region Selection

**Question**: How should the generator find a passable start tile in "bottom half, center horizontal half" given that water border post-processing may remove some options?

**Decision**: Run start-region selection *after* the water border post-processing pass. Scan all tiles, collect those satisfying:
- `coord.r >= Math.floor(height / 2)` (bottom half of rows)
- `qi >= Math.floor(width / 4)` and `qi < width - Math.floor(width / 4)` (center 50% of columns)
- `tile.passable === true`

If the candidate set is non-empty, pick the one with the minimum Euclidean distance to the ideal center-bottom point `(width/2, height - 1)` in `(qi, r)` space. If the candidate set is empty (entire start region is water), force the grid-center tile of the start region to `grassland` / `passable: true` / `moveCost: 1`.

**Rationale**: Post-processing water border first ensures that no border tile can accidentally be selected as the start. Sorting by distance to center-bottom produces a predictable, natural-feeling start position closest to the bottom-center. The fallback guaranteed-passable tile satisfies FR-005.

**Alternatives considered**:
- Pick any random passable tile in region — non-deterministic for same seed. Rejected.
- Use the top-left passable tile of the region — arbitrary feel; would be near a map edge. Rejected.

---

## Decision 5 — Seed Info Card Component Design

**Question**: Should we extend `ModeLabel` or create a new standalone component? Where should it be positioned? What should it display?

**Decision**: Create a new standalone `SeedInfoCard` class in `src/game/ui/SeedInfoCard.ts`. This component replaces `ModeLabel` in `WorldMap.ts` as the primary top-right HUD element. It shows both the game mode badge and the seed in a single card matching `StatPanel` styling.

**Layout**:
```
┌──────────────────────────────┐
│  CASUAL   (green pill)       │
│  Seed: lrno8owk3x7mq2p       │
└──────────────────────────────┘
```
- Positioned `fixed top-3 right-3` (same as current `ModeLabel`)
- Styled: `bg-gray-900/90 border border-gray-600 rounded-xl p-4 w-56 pointer-events-none z-50`
- Mode pill uses the same color logic as current `ModeLabel` (green for casual, red for roguelike)
- Seed line: label "SEED" in gray-400, value in white monospace

**Rationale**: A card matches StatPanel conventions (spec FR-007). Placing it top-right fits the existing ModeLabel slot — avoids adding a new layout zone. One component instead of two avoids redundant DOM elements and simplifies destroy lifecycle. Replacing (not adding to) `ModeLabel` avoids having two overlapping top-right elements.

**Alternatives considered**:
- Extend `ModeLabel` to add seed text — `ModeLabel` is a pill badge, not a card; restyling it is more invasive than a new component. Rejected.
- Separate `SeedInfoCard` alongside `ModeLabel` — two components in the same corner causes layout collision. Rejected.
- Place seed at bottom-right near save bar — already occupied; would need layout reconfiguration. Rejected.

---

## Decision 6 — No New External Dependencies

**Conclusion**: All changes are implemented with existing utilities:
- `createNoise2D` / `PRNG` — no changes
- `Math.random()` — for seed uniqueness suffix
- Tailwind CSS utility classes — for card styling (already used project-wide)
- Vitest — for new unit tests (already used)

No new npm packages required.
