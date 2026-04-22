# Data Model: Random Map Generation

**Branch**: `005-random-map-generation`  
**Date**: 2026-04-22

---

## Overview

This feature introduces no **new** persistent entities. It modifies the behavior of the existing `MapGenerator` and adds a new UI component. The existing `WorldMap.seed` field and `SaveState.worldMap` already carry everything needed.

---

## Existing Entities — Unchanged Structure

### `WorldMap` *(no field changes)*

```ts
interface WorldMap {
  seed: string;          // already persisted in SaveState — no change needed
  width: number;
  height: number;
  tiles: Record<string, HexTile>;
  towns: TownId[];
  enemyCamps: EnemyCampId[];
  playerStartCoord: HexCoord;
  remainingTurnBudget?: number;
}
```

Seed format changes from `run_${Date.now()}` → `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}` (e.g., `lrno8owk3x7mq2p`) but the field type `string` is unchanged. The schema validator `z.string().min(1)` already covers both forms.

### `HexTile` *(no field changes)*

Border tiles will be forced to:
- `terrain: 'ocean'`
- `passable: false`
- `moveCost: 1`
- `poiTag: 'empty'`

No new fields required.

---

## Map Generator Behavior Changes

### `generateMap(seed, width, height): WorldMap`

**Location**: `src/modules/hex-grid/MapGenerator.ts`

**Added behavior** (same pure-function signature, no API change):

1. **Water border post-processing** — after the tile generation loop, iterate all tiles and override any tile where `isBorderTile(coord, width, height) === true` to ocean/impassable:
   ```ts
   function isBorderTile(coord: HexCoord, width: number, height: number): boolean {
     const qi = coord.q + Math.floor(coord.r / 2);
     return coord.r < 2 || coord.r >= height - 2 || qi < 2 || qi >= width - 2;
   }
   ```

2. **Start region selection** — replace the current first-passable-tile scan with:
   ```ts
   function isInStartRegion(coord: HexCoord, width: number, height: number): boolean {
     const qi = coord.q + Math.floor(coord.r / 2);
     const qMin = Math.floor(width / 4);
     const qMax = width - Math.floor(width / 4);
     return coord.r >= Math.floor(height / 2) && qi >= qMin && qi < qMax;
   }
   ```
   - Collect all `passable` tiles in start region (after border post-process).
   - If found: pick the tile minimizing `Math.hypot(qi - width/2, r - (height - 1))`.
   - If none: force the center-bottom tile to grassland and use it.

**No change to `generateMap` return type or signature** — full backward compatibility with all existing consumers.

---

## New UI Entity

### `SeedInfoCard`

**Location**: `src/game/ui/SeedInfoCard.ts`  
**Purpose**: Card-style HUD component replacing `ModeLabel` in `WorldMap.ts`, displaying both game mode and map seed.

**Constructor**:
```ts
constructor(mode: GameModeType, seed: string)
```

**Methods**:
```ts
destroy(): void   // removes DOM element
```

**Rendering**:
```html
<div id="seed-info-card"
  class="fixed top-3 right-3 bg-gray-900 bg-opacity-90 border border-gray-600
         rounded-xl p-4 w-56 pointer-events-none z-50">
  <div class="flex items-center gap-2 mb-2">
    <span class="[mode color pill]">CASUAL | ROGUELIKE</span>
  </div>
  <div class="flex justify-between text-xs">
    <span class="text-gray-400 uppercase">Seed</span>
    <span class="text-white font-mono text-right truncate ml-2">{seed}</span>
  </div>
</div>
```

**Integration in `WorldMap.ts`**:
- Replace `private modeLabel!: ModeLabel` field with `private seedInfoCard!: SeedInfoCard`
- `create()`: instantiate after `generateMap` (seed is available), remove `ModeLabel` import
- `restoreFromSave()`: instantiate with `saveState.worldMap.seed`
- `shutdown()` / scene cleanup: call `seedInfoCard.destroy()`

---

## Validation Rules

| Rule | Where enforced | Details |
|------|---------------|---------|
| Seed non-empty | `world-map.schema.ts` line 23 | `z.string().min(1)` — already present |
| Border tiles always ocean | `MapGenerator` post-process | Applied before `playerStartCoord` selection |
| Start in valid region | `MapGenerator` start selection | Applied after border post-process |
| Seed displayed on load | `WorldMap.restoreFromSave` | `SeedInfoCard` constructed with `saveState.worldMap.seed` |

---

## State Transitions

```
New Game:
  1. seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  2. generateMap(seed, width, height)
     → apply border post-process
     → select start in bottom-center region
  3. SeedInfoCard(mode, seed) mounted
  4. WorldMap scene active

Load Game:
  1. Retrieve saveState.worldMap.seed
  2. generateMap(seed, width, height)  ← same seed → identical map
  3. SeedInfoCard(mode, seed) mounted
  4. WorldMap scene active
```

---

## No Schema Changes Required

`world-map.schema.ts` already validates `seed: z.string().min(1)`. The new seed format is a valid non-empty string. No migration required.
