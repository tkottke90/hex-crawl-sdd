# Feature Specification: World Map Camera Behavior

**Feature Branch**: `002-world-map-camera`  
**Created**: 2026-04-21  
**Status**: Draft  
**Input**: User description: "Add camera behavior to the world map navigation spec: the camera should follow the party's active character with a smooth tween. Arrow keys or WASD scroll the camera independently. Zoom is out of scope for v1. When the game loads, it should center the camera on the tile the player is in."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Camera Centers on Player at Load (Priority: P1)

When the world map loads (either from a new game or resuming a save), the camera is automatically
positioned so the tile occupied by the player's active character is centered in the viewport. The
player immediately knows where they are without any manual scrolling.

**Why this priority**: If the camera starts in a random or default position, the player is
disoriented from the first frame. Correct initial placement is the baseline requirement all other
camera behaviors build on.

**Independent Test**: Load the world map (fresh game or saved game) and verify — without pressing
any key — that the active character's tile is visible and at the center of the viewport.

**Acceptance Scenarios**:

1. **Given** a new game starts and the world map is rendered, **When** the first frame is drawn,
   **Then** the viewport is centered on the tile that contains the active character.
2. **Given** the player resumes a saved game, **When** the world map scene loads, **Then** the
   viewport is centered on the tile of the active character's saved position, not on a default
   map origin.

---

### User Story 2 — Camera Follows Active Character (Priority: P2)

When the player moves the active character to a new tile, the camera smoothly pans to keep that
character centered in the viewport. The pan uses a fluid tween so the transition is visually
clear — the player always knows which character is active and where they are going.

**Why this priority**: Without follow behavior, moving the character off-screen would require the
player to manually re-find them, breaking the spatial awareness that is central to hex navigation.

**Independent Test**: Move the active character three consecutive tiles in any direction and confirm
the camera smoothly tracks to each destination tile without jumping or snapping.

**Acceptance Scenarios**:

1. **Given** the active character is on tile A, **When** the player moves them to adjacent tile B,
   **Then** the camera begins a smooth tween toward tile B immediately and completes the pan within
   a perceptually smooth window (under 400 ms).
2. **Given** a tween is in progress toward tile B, **When** the player queues another move to
   tile C, **Then** the camera tween updates its destination to tile C without a jarring cut.
3. **Given** the active character does not move (their turn ends without movement), **When** the
   next character becomes active, **Then** the camera pans to the new active character's tile
   using the same smooth tween.

---

### User Story 3 — Manual Camera Pan with Keyboard (Priority: P3)

The player can take manual control of the camera by holding Arrow keys or WASD. The camera
scrolls in the corresponding direction independently of any character position. Releasing the
keys stops the scroll. The player can inspect distant tiles and then tap the re-center button
(bottom-right corner of the viewport) to return to the active character at any time.

**Why this priority**: Scouts and tactical planning require seeing tiles beyond the immediate
character position. Manual pan supplements (not replaces) automatic follow, giving the player
situational awareness.

**Independent Test**: Hold the Right Arrow key and confirm the viewport moves independently of
the active character. Release the key and verify the camera stops. Confirm that tapping the
re-center button (bottom-right) triggers an ease-out tween back to the active character.

**Acceptance Scenarios**:

1. **Given** the world map is active, **When** the player holds an Arrow key or WASD key,
   **Then** the camera scrolls continuously in the corresponding direction at a consistent speed.
2. **Given** the player is holding a pan key, **When** they release it, **Then** the camera stops
   scrolling with no overshoot or drift.
3. **Given** the camera has been manually panned away from the active character, **When** the
   player moves the active character to a new tile, **Then** the camera transitions back to
   follow the character (follow behavior resumes).
4. **Given** the camera has been manually panned away from the active character, **When** the
   player taps the re-center button in the bottom-right corner, **Then** the camera performs
   an ease-out tween to center on the active character's tile and follow mode resumes.
5. **Given** two conflicting pan keys are held simultaneously (e.g. Left + Right), **When** both
   are pressed, **Then** the horizontal motion cancels out and the camera does not move on that
   axis.

---

### Edge Cases

- What happens when the active character's tile is at the edge of the map and cannot be fully
  centered? → The camera halts at the map boundary; it does not scroll beyond the renderable area.
- What happens if a move tween completes while a manual pan is in progress? → Manual pan input
  takes priority; the follow tween does not override an active manual pan. This applies to
  passively completing tweens only — a new `moveOccupant()` call always triggers `followTo()`
  per FR-009 regardless of whether the camera is currently being panned.
- What happens when the active character changes mid-tween (e.g. the previous character's move
  animation finishes and the next character is highlighted)? → The camera redirects its tween
  destination to the newly active character without interrupting smoothness.
- What happens on very small viewport sizes where the map tile is effectively full-screen?
  → Camera still attempts to center; boundary clamping prevents overflow.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On world map scene load, the camera MUST be positioned so the active character's
  tile is centered in the viewport before the first interactive frame is presented to the player.
- **FR-002**: When the active character moves to a new tile, the camera MUST begin a smooth
  tween to center on the destination tile immediately after movement is committed.
  "Committed" means the moment `moveOccupant()` records the new tile (before any sprite
  animation plays) — the camera tween starts in the same frame as the logical move.
- **FR-003**: The follow tween MUST use an ease-out curve (fast start, decelerating into the
  destination). For a single-tile move the tween MUST complete within 400 ms. For multi-tile
  moves the duration MUST scale linearly with tile count, capped at a maximum of 600 ms,
  under normal gameplay conditions (≥ 30 fps).
- **FR-004**: The active character follow behavior MUST extend to character switching: whenever
  the active character token changes, the camera pans to the newly active character's tile.
- **FR-005**: Players MUST be able to pan the camera manually using Arrow keys (Up, Down, Left,
  Right) and WASD equivalents (W, A, S, D).
- **FR-006**: Manual pan MUST scroll the camera independently of any character position; the
  camera is NOT locked to a character while a pan key is held.
- **FR-007**: Manual pan speed MUST be 5 tiles per second, consistent and responsive with no
  perceptible input lag (camera movement begins within one rendered frame of key press).
- **FR-008**: Opposing pan keys pressed simultaneously (e.g. Left + Right or Up + Down) MUST
  cancel each other on the conflicting axis; the camera does not move on that axis.
- **FR-009**: When the active character moves, the camera MUST resume follow behavior and tween
  to the character's new tile regardless of whether the camera was manually panned.
- **FR-013**: A persistent re-center button MUST be displayed in the bottom-right corner of the
  viewport at all times during world map navigation. Activating it MUST immediately begin a
  300 ms ease-out tween to center the camera on the active character's tile and resume follow
  mode. The visual design (icon, label) is left to implementation.
- **FR-010**: The camera MUST be clamped to the map's renderable boundaries; it MUST NOT scroll
  to reveal empty space beyond the map edges.
- **FR-011**: Zoom (pinch, scroll-wheel, keyboard zoom) is explicitly OUT OF SCOPE for v1 and
  MUST NOT be implemented.
- **FR-012**: During enemy and NPC turns the camera MUST remain stationary at the position it
  occupied at the end of the last player-controlled character's action; the camera MUST NOT
  automatically pan to track enemy or NPC unit movement.

### Key Entities

- **Camera**: The viewport into the world map scene. Has a position (world-space coordinate),
  operates in follow mode or free-pan mode, and respects map boundary constraints.
- **Active Character**: A player-controlled party member whose turn it is, or who is currently
  selected for movement. Enemy and NPC units are never treated as the active character for
  camera-follow purposes. Determines the camera's follow target.
- **Follow Tween**: A time-limited ease-out interpolation from the camera's current position to
  the active character's tile center. Decelerates smoothly into the destination. Can be
  interrupted and redirected by new movement or character switches.
- **Map Boundary**: The minimum and maximum world-space coordinates of the rendered hex map.
  The camera position is clamped within these bounds at all times.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The active character's tile is centered in the viewport on the first interactive
  frame after world map load — verified in 100% of test runs (new game and loaded save).
- **SC-002**: Camera follow tween completes within ≤ 400 ms for single-tile moves and ≤ 600 ms
  for multi-tile moves, under normal frame-rate conditions (≥ 30 fps).
- **SC-003**: Manual pan input is visually responsive with no perceptible lag; camera movement
  begins within one rendered frame (≤ 33 ms at 30 fps / ≤ 16 ms at 60 fps) of key press.
- **SC-004**: Players can locate the active character on the map without scrolling in 100% of
  post-move states (camera always returns to follow after a move).
- **SC-005**: No camera boundary violations occur in automated test runs across 50 varied map
  seeds — the camera never exposes empty space beyond map edges.

---

## Clarifications

### Session 2026-04-21

- Q: During enemy / NPC turns on the world map, what should the camera do? → A: Camera stays on last player character's position during enemy/NPC turns — no camera movement.
- Q: What easing function should the follow tween use? → A: Ease-out (fast start, decelerates into destination).
- Q: What should the manual pan speed be? → A: 5 tiles per second.
- Q: For multi-tile moves, should tween duration scale with distance or stay fixed? → A: Scale linearly with distance, capped at 600 ms.
- Q: When the camera has been manually panned away, should there be an explicit re-center control? → A: Yes — a dedicated re-center button fixed to the bottom-right corner of the viewport; tapping it snaps the camera back to the active character.

---

## Assumptions

- World map navigation (character movement, tile selection, turn management) exists as implemented
  in feature `001-hex-crawl-game`; this feature adds only camera behavior on top of it.
- The game renders at a target of 60 fps; 400 ms tween durations are calibrated to this but
  remain smooth down to 30 fps.
- There is always exactly one active character token during world map navigation **after the
  scene has finished loading**. At the very start of `create()`, before party construction
  completes, the active character may be temporarily null; the camera MUST NOT center or pan
  until the active character is set. Once set, the invariant holds for the remainder of the
  session.
- Re-centering is available via both implicit trigger (character moves) and a persistent UI button
  in the bottom-right corner of the viewport. The button is always visible during world map
  navigation. Its visual design (icon, label) is left to implementation.
- Mobile / touch pan gestures are out of scope for v1; only keyboard pan input is required.
- Diagonal Arrow / WASD combinations (e.g. Up + Right simultaneously) MUST scroll the camera
  diagonally; this is standard behavior and no clarification is needed.
