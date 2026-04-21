# Research: World Map Camera Behavior

**Feature**: `002-world-map-camera`  
**Date**: 2026-04-21  
**Status**: Complete — all NEEDS CLARIFICATION items resolved

---

## R-001: Phaser 3 Camera.pan() vs. Camera.scrollX/Y for Tweened Follow

**Decision**: Use `Phaser.Cameras.Scene2D.Camera.pan(x, y, duration, ease)` for all follow tweens.

**Rationale**: `camera.pan()` is the canonical Phaser 3 method for animated camera movement to a
target world coordinate. It handles interrupted tweens gracefully when called again mid-flight —
the earlier tween is cancelled and the new destination takes over. This eliminates the need to
manage a separate `this.tweens.add()` lifecycle for the camera. `scrollX/Y` manipulation is a
lower-level approach that requires manual interpolation and does not benefit from Phaser's built-in
tween interruption.

**Alternatives considered**:
- `this.tweens.add({ targets: cam, scrollX, scrollY })` — works but requires null-guard on
  concurrent tweens and manual easing application; dropped in favour of `camera.pan()`.
- Camera `lerp` (continuous fractional follow) — appropriate for real-time follow but does not
  satisfy the discrete "tween to destination and stop" requirement implied by hex tile movement.

---

## R-002: Coordinate System — Pixel Origin and Camera World Coordinate Mapping

**Decision**: The map renders tiles relative to a world-space origin of `(0, 0)`. The `offsetX /
offsetY` viewport-centering hack in the current `WorldMap.ts` (`renderMap`, `renderParty`) must
be removed; instead the camera will be positioned via `camera.centerOn(worldX, worldY)` at scene
creation.

**Rationale**: The existing codebase adds `this.scale.width / 2` and `this.scale.height / 2` to
every tile and sprite position to simulate centering. This works when the camera has no scroll,
but breaks camera pan: the camera would pan relative to these inflated pixel positions and the
"center on active character" world coordinate would not match the actual sprite position used by
Phaser's follow/pan system. The correct pattern is:
1. Render tiles at their raw `toPixel(coord, TILE_SIZE)` world coordinates (with a margin offset
   so the map origin tile is not flush with screen edge).
2. On scene init call `camera.centerOn(activeCharWorldX, activeCharWorldY)`.
3. All subsequent pans reference the same world coordinate space.

**Alternatives considered**:
- Keep current offset convention and add offset correction when calling `camera.pan()` — brittle
  and error-prone; rejected.

---

## R-003: Keyboard Pan — Phaser Cursor Keys vs. Custom Key Capture

**Decision**: Use `this.input.keyboard!.createCursorKeys()` for Arrow keys and manually add WASD
via `this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.*)` in the scene's `update()`
loop.

**Rationale**: `createCursorKeys()` returns a pre-wired `CursorKeys` object covering Up/Down/
Left/Right and is idiomatic Phaser. WASD keys must be added individually as Phaser does not
provide a WASD shortcut. Both sets are polled each frame in `update()`, which is the standard
Phaser pattern for continuous input. Opposing key cancellation is achieved by checking both
members of each axis pair and applying zero delta when both are active.

**Alternatives considered**:
- Event-listener approach (`scene.input.keyboard.on('keydown')`) — suitable for one-shot actions,
  not continuous scroll; rejected.

---

## R-004: Camera Boundary Clamping

**Decision**: Use `camera.setBounds(minX, minY, worldWidth, worldHeight)` where `worldWidth`
and `worldHeight` are derived from the bounding box of all rendered tiles, plus a configurable
padding constant.

**Rationale**: Phaser's built-in `setBounds` prevents the camera from revealing empty space and
integrates with both `pan()` and `scrollX/Y` manipulation — the boundary is respected by all
camera movement methods. The bound rectangle must be computed once after tile rendering (scanning
min/max x,y of all `toPixel` results) to match the actual map footprint.

**Alternatives considered**:
- Manual clamp of `scrollX/Y` in `update()` — would work but duplicates logic already in Phaser;
  rejected.

---

## R-005: Re-Center Button — DOM vs. Phaser UI

**Decision**: Implement the re-center button as a DOM element (`<button>`) injected into
`document.body`, positioned with Tailwind CSS (`fixed bottom-4 right-4 z-30`), following the
same pattern as the existing save-bar in `WorldMap.ts`.

**Rationale**: The existing `renderSaveBar()` establishes the precedent: all HUD controls in this
project are DOM overlays. This is intentional — DOM elements are accessible, easy to style with
Tailwind, and do not require a Phaser UI camera. Mixing Phaser UI objects for a single button
would add inconsistency.

**Alternatives considered**:
- Phaser `Text` or `Image` game object on a fixed UI camera — would require a second camera and
  depth management; rejected.

---

## R-006: Follow Mode State — Tracking When Free-Pan Is Active

**Decision**: Track camera mode with a simple boolean flag `private _freePanActive: boolean`
on the `WorldMap` scene. The flag is set `true` when any pan key is held and reset `false` when
the active character moves (triggering follow tween) or the re-center button is tapped.

**Rationale**: The spec distinguishes two behaviours — follow mode (camera tracks character) and
free-pan mode (camera controlled by keyboard). A boolean is the minimal representation of this
binary state. More complex state machines are not warranted for v1.

**Alternatives considered**:
- Separate `CameraController` class — appropriate for a larger feature surface; deferred to a
  future iteration if camera behaviour grows (e.g. zoom, cinematic sequences).

---

## R-007: Multi-Tile Move Tween Duration Scaling

**Decision**: Duration = `Math.min(150 * tilePath.length, 600)` ms. Single-tile = 150 ms
(well under the 400 ms cap), three-tile path = 450 ms, four+ tile paths cap at 600 ms.

**Rationale**: The spec requires ≤ 400 ms for single-tile and ≤ 600 ms cap for multi-tile,
scaled linearly. Using 150 ms per-tile gives a responsive single-tile feel while keeping
multi-tile readable. The existing character sprite tween in `WorldMap.ts` uses 300 ms for a
single tile; the camera pan using 150 ms per tile will complete at the same time as the sprite
for a two-tile path, which is visually correct.

**Alternatives considered**:
- 200 ms per tile (single = 200 ms, three = 600 ms capped) — slightly slower single-tile
  response; acceptable but 150 ms was preferred for snappiness.
- Fixed 400 ms regardless of path length — rejected per spec.

---

## R-008: NEEDS CLARIFICATION Resolved

All NEEDS CLARIFICATION items from the spec were resolved during the clarification session
(2026-04-21):

| Item | Resolution |
|------|-----------|
| Enemy-turn camera behavior | Camera stationary during enemy/NPC turns (FR-012) |
| Easing function | Ease-out (`Quad.easeOut`, consistent with existing sprite tween) |
| Manual pan speed | 5 tiles per second (≈ 180 px/s at TILE_SIZE=36) |
| Multi-tile tween duration | Linear scale capped at 600 ms (150 ms/tile) |
| Re-center control | DOM button, bottom-right corner, ease-out tween to character |
