# Data Model: World Map Camera Behavior

**Feature**: `002-world-map-camera`  
**Date**: 2026-04-21

---

## Entities & Types

### CameraMode

Tracks whether the camera is in follow mode or free-pan mode.

```typescript
type CameraMode = 'follow' | 'free-pan';
```

### CameraState

The full runtime state of the camera controller, held as private fields on the `WorldMap` scene.

```typescript
interface CameraState {
  /** Current logical mode. */
  mode: CameraMode;

  /**
   * Pan speed in pixels per second for keyboard-driven free-pan.
   * Derived from the spec constant: 5 tiles/sec × TILE_SIZE px/tile.
   * At TILE_SIZE = 36: PAN_SPEED = 180 px/s.
   */
  panSpeed: number;

  /**
   * Reference to the active character whose tile position the camera follows.
   * null only during the brief window between scene init and party construction
   * completing. Camera centering must be deferred until this is non-null.
   */
  followTargetId: string | null;

  /**
   * Whether a re-center tween is currently in flight (guards against
   * double-triggering from the re-center button).
   */
  isTweening: boolean;
}
```

### CameraBounds

Derived once after tile rendering; passed to `camera.setBounds()`.

```typescript
interface CameraBounds {
  /** Minimum world-space x across all rendered tile centres. */
  minX: number;
  /** Minimum world-space y across all rendered tile centres. */
  minY: number;
  /** Total renderable width (maxX - minX + padding). */
  width: number;
  /** Total renderable height (maxY - minY + padding). */
  height: number;
}
```

---

## Constants

```typescript
/** Pixel size of one hex tile (centre to vertex). Matches WorldMap.ts. */
const TILE_SIZE = 36;

/**
 * Manual keyboard pan speed in pixels per second.
 * Spec FR-007: 5 tiles/sec × TILE_SIZE.
 */
const PAN_SPEED = 5 * TILE_SIZE; // 180

/**
 * Camera boundary padding (px) added around the map bounding box
 * so the edge tiles are not flush with the screen boundary.
 */
const CAM_BOUND_PADDING = TILE_SIZE * 2; // 72

/**
 * Follow tween duration per tile step (ms).
 * Spec FR-003: single-tile ≤ 400 ms; multi-tile linear scale capped at 600 ms.
 * 150 ms/tile → single = 150 ms, 4+ tiles = 600 ms cap.
 */
const TWEEN_DURATION_PER_TILE = 150;

/** Maximum tween duration regardless of path length (ms). Spec FR-003. */
const TWEEN_MAX_DURATION = 600;

/** Easing applied to all camera follow and re-center tweens. Spec FR-003. */
const TWEEN_EASE = 'Quad.easeOut';
```

---

## Derived Computations

### World Coordinate of a Tile Centre

Used when computing the camera follow target and re-center destination.

```typescript
function tileWorldPos(coord: HexCoord): { x: number; y: number } {
  return toPixel(coord, TILE_SIZE);
  // Note: after the rendering refactor (R-002) tiles render at raw toPixel()
  // world coords; no viewport offset addition needed here.
}
```

### Follow Tween Duration

```typescript
function followDuration(pathLength: number): number {
  return Math.min(TWEEN_DURATION_PER_TILE * pathLength, TWEEN_MAX_DURATION);
}
```

### Camera Bounds Derivation

```typescript
function computeMapBounds(tiles: HexTile[]): CameraBounds {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const tile of tiles) {
    const { x, y } = toPixel(tile.coord, TILE_SIZE);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return {
    minX: minX - CAM_BOUND_PADDING,
    minY: minY - CAM_BOUND_PADDING,
    width: (maxX - minX) + CAM_BOUND_PADDING * 2,
    height: (maxY - minY) + CAM_BOUND_PADDING * 2,
  };
}
```

---

## State Transitions

```
                    ┌───────────────────────────────────┐
                    │          Scene created             │
                    │   camera.centerOn(activeChar)      │
                    │   mode = 'follow'                  │
                    └──────────────┬────────────────────┘
                                   │
                    ┌──────────────▼────────────────────┐
                    │          FOLLOW MODE               │◄──────────────────┐
                    │  camera.pan() on char move         │                   │
                    └──────────────┬────────────────────┘                   │
                                   │                                         │
                         Pan key held down                                   │
                                   │                                   Character moves
                    ┌──────────────▼────────────────────┐            OR re-center tapped
                    │         FREE-PAN MODE              │                   │
                    │  camera scroll via update() loop   ├───────────────────┘
                    └───────────────────────────────────┘
```

**Transition rules**:
| Event | From | To | Action |
|-------|------|----|--------|
| Scene `create()` completes | — | follow | `camera.centerOn(charX, charY)` |
| Pan key pressed | follow | free-pan | set `mode = 'free-pan'` |
| All pan keys released | free-pan | free-pan | no mode change (stays free-pan until follow re-engages) |
| Active character moves | free-pan or follow | follow | `camera.pan(destX, destY, duration, ease)` |
| Re-center button tapped | free-pan | follow | `camera.pan(charX, charY, 300, 'Quad.easeOut')` |
| Active character switches (turn change) | follow | follow | `camera.pan(newCharX, newCharY, 300, 'Quad.easeOut')` |
| Enemy/NPC turn starts | any | unchanged | no camera action |
