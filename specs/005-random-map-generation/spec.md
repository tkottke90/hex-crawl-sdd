# Feature Specification: Random Map Generation

**Feature Branch**: `005-random-map-generation`
**Created**: 2026-04-22
**Status**: Draft
**Input**: User description: "Currently the application always generates the same map. We want the map generation to be random each time a new game is created. With that being said, we want to make sure some rules exist for map generation: 1. To start, the outer most 2 layers on the border of the map should always be water (for now). 2. The player should always start at the bottom-center 1/2 of the map. Going up makes more sense than going down."

## Clarifications

### Session 2026-04-22

- Q: How wide is the horizontal center zone for player start placement — 25%, 33%, or 50% of map width? → A: Center 50% (half) of map width.
- Q: Should the seed be visible to the player in the UI, or remain internal only? → A: Display the seed in a card-style info panel on the world map, similar in style to the character stat display.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New Game Produces a Unique Map (Priority: P1)

As a player, I get a new and different map layout every time I start a new game, so repeat runs feel fresh and exploration is unpredictable.

**Why this priority**: This is the core value of the feature. If every run produces the same map the game has no replayability. All other rules in this feature depend on a map actually being generated.

**Independent Test**: Start two new games back-to-back and compare the inner terrain layouts. The tile terrain distribution should differ between the two runs.

**Acceptance Scenarios**:

1. **Given** a player starts a new game, **When** the world map loads, **Then** the inner terrain layout is determined by a different seed each run so no two consecutive new games produce the identical map.
2. **Given** a save state exists with a seed, **When** the player loads that save, **Then** the map is reconstructed from the saved seed and matches the original layout exactly.

---

### User Story 2 - Map Is Always Bounded by Water (Priority: P2)

As a player, the world always feels like a landmass surrounded by ocean, so the map has clear natural edges and the player is never surprised by impassable tiles appearing randomly at the border.

**Why this priority**: Without guaranteed water borders the random generation could produce awkward cut-off terrain at the edges, breaking the sense that the world is a coherent island.

**Independent Test**: Load any new-game map and inspect the tiles along the outermost two rows and columns. All of them must be water terrain and must be impassable.

**Acceptance Scenarios**:

1. **Given** any new game is started, **When** the world map is displayed, **Then** all tiles in the outermost two tile-layers of the map boundary are water terrain.
2. **Given** the border tiles are water, **When** the player attempts to move toward a border tile, **Then** the tile is treated as impassable and the party cannot enter it.
3. **Given** the inner terrain is randomly generated, **When** the border rule is applied, **Then** the border tiles are forced to water regardless of what the noise function would have assigned to them.

---

### User Story 3 - Player Always Starts in the Bottom-Center Region (Priority: P2)

As a player, my party always begins in the lower half of the map near the horizontal center, so the world naturally opens upward and exploration feels like a journey away from a familiar starting area.

**Why this priority**: Without a consistent start region the player could spawn anywhere — including near a map edge — making navigation confusing and breaking the intended "journey upward" feel.

**Independent Test**: Start several new games with different seeds and verify the player start coordinate is always within the bottom half of the map and within the center horizontal half of the map width.

**Acceptance Scenarios**:

1. **Given** a new game is started, **When** the world map is generated, **Then** the player starting tile is located in the bottom half of the map height and within the center horizontal half of the map width.
2. **Given** the designated start region contains no passable tile, **When** the generator places the start, **Then** the tile closest to the map's center-bottom point within the start region is forced to a passable terrain and used as the start coordinate.
3. **Given** the player start coordinate is placed, **When** the world map is displayed, **Then** the camera centers on the start tile and the party marker is rendered there.

---

### User Story 4 - Seed Is Visible on the World Map (Priority: P3)

As a player, I can see the current run's map seed displayed on the world map screen so I can note it, share it with others, or reference it when discussing a particular run.

**Why this priority**: The seed display is informational only and does not affect gameplay. It adds value for players who want to share or revisit a particular map, but the core random-generation feature is complete without it.

**Independent Test**: Start a new game and confirm a seed info card is visible on the world map screen, showing the run seed, styled consistently with other HUD cards.

**Acceptance Scenarios**:

1. **Given** a new game has been started, **When** the world map is displayed, **Then** a seed info card is visible on screen showing the current run's seed value.
2. **Given** the seed card is shown, **When** the player saves and reloads the game, **Then** the seed card still shows the same seed that was displayed before saving.
3. **Given** the seed card is visible, **When** the player reads it, **Then** the seed value matches the seed stored in the save state.

---

### Edge Cases

- What happens if the entire bottom-center region is water? The generator must guarantee at least one passable tile exists in the start region; if the noise would prevent this, the start region must be forced to a passable terrain before placing the player.
- What happens when a save is loaded? The saved seed is used to reconstruct the identical map — no new seed is generated on load.
- What happens if the map width or height is very small? The two-layer water border still applies; the generator must ensure the inner playable area is at least one tile wide in each direction.
- What happens when two consecutive runs happen within the same millisecond? The seed must still produce a distinct map — using a combination of timestamp and a random component ensures uniqueness even at high frequency.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A new unique seed MUST be generated at the start of every new game. The seed MUST NOT be reused from a previous run. The seed MUST be stored in the save state and used to reconstruct the same map on load.
- **FR-002**: The outermost two tile-layers along all four edges of the map grid MUST always be assigned water terrain, regardless of what the noise function produces for those coordinates.
- **FR-003**: Water border tiles MUST be impassable. The party MUST NOT be able to move into or through them.
- **FR-004**: The player start coordinate MUST be located within the bottom half of the map height and within the center horizontal half of the map width.
- **FR-005**: If no passable tile exists within the designated start region, the generator MUST force at least one tile in that region to a passable terrain before placing the player.
- **FR-006**: Map generation MUST remain deterministic: the same seed, width, and height MUST always produce the identical tile layout.
- **FR-007**: The world map screen MUST display a seed info card showing the current run's seed value, styled consistently with other HUD info cards such as the character stat panel. The card MUST be visible at all times while the world map is active.

### Key Entities *(include if feature involves data)*

- **Map Seed**: A unique string generated fresh for each new game run, stored in save state, and used as the sole input that determines a map's layout.
- **Seed Info Card**: A HUD element on the world map screen that displays the current run's seed value, styled consistently with other card-style info panels.
- **Water Border Zone**: The set of tiles occupying the outermost two tile-layers on all edges of the map grid. These tiles are always water and always impassable.
- **Player Start Region**: The rectangular sub-region of the map bounded by the bottom half of map height and the center horizontal half of map width, within which the player starting tile must be placed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a sample of 10 consecutive new games, no two maps produce the identical inner terrain layout (confirmed by comparing terrain type distributions or tile-by-tile comparison of a fixed inner region). *(Unit tests verify this property with 2 seeds; manual validation with 10 games is the acceptance bar.)*
- **SC-002**: On any generated map, 100% of tiles within the outer two tile-layers on all edges are water terrain and are impassable.
- **SC-003**: On any generated map, the player start coordinate falls within the bottom half of map height and the center horizontal half of map width.
- **SC-004**: A map reconstructed from a previously saved seed is byte-for-byte identical in its tile layout to the original generated map.
- **SC-005**: The seed info card is visible on the world map screen within one render frame of scene readiness, and its displayed seed matches the seed stored in the active save state.

## Assumptions

- The map grid uses offset axial hex coordinates; "outer two layers" refers to the two outermost rows and columns of the rectangular grid used to generate tile coordinates.
- "Bottom half" means the lower 50% of the map's row range; "center horizontal half" means the middle 50% of the map's column range.
- The inner terrain (outside the water border) continues to use the existing noise-based biome algorithm; only the border override and start placement are new constraints.
- Seed uniqueness is achieved by combining a timestamp with a random component so that rapid consecutive runs cannot share a seed.
- No manual seed entry by the player is in scope for this feature.
- Towns, enemy camps, and other POI placement are out of scope for this feature — they remain as implemented.
