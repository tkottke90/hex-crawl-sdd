# Data Model: World Map Terrain Detail

## Scope

This feature adds a runtime presentation model for the world map. It does not introduce a new persisted game-state schema.

## Entities

### RenderedTile

Represents the visual state for one visible hex on the world map.

| Field | Type | Description |
|-------|------|-------------|
| `coord` | `HexCoord` | The tile's axial/cube position. |
| `terrain` | `TerrainType` | The terrain identity already present on the map model. |
| `explored` | `boolean` | Whether the tile is visible without fog treatment. |
| `frameState` | `0 | 1` | The current visual step in the two-step animation loop. |
| `phaseOffsetMs` | `number` | Deterministic offset used so tiles do not animate in lockstep. |
| `depth` | `number` | Render depth relative to overlays and the party marker. |

**Relationships**

- Derived from one `HexTile` in the world-map model.
- Rendered behind the party marker and above the background scene.

**Validation rules**

- Every visible tile must have exactly one rendered presentation entry.
- `frameState` must always stay within the two-step range.
- `phaseOffsetMs` must be deterministic for a tile so the same tile animates consistently after redraws.

### TileAnimationProfile

Defines the lightweight animation behavior for a terrain tile.

| Field | Type | Description |
|-------|------|-------------|
| `terrain` | `TerrainType` | Terrain family being animated. |
| `frameKeys` | `[string, string]` | Two visual states used for the loop. |
| `cycleMs` | `number` | Base cycle length for the two-step loop. |
| `offsetMs` | `number` | Per-tile phase offset derived from the tile coordinate. |

**Relationships**

- Used by `RenderedTile` to decide which texture or frame to draw.
- Can be shared by many tiles of the same terrain type.

**Validation rules**

- Each profile must expose exactly two frames for the v1 animation loop.
- The phase offset must not alter the terrain identity or tile position.

### PartyMarker

Represents the visible yellow circle that shows the player's current party position.

| Field | Type | Description |
|-------|------|-------------|
| `coord` | `HexCoord` | Current occupied hex. |
| `textureKey` | `string` | Visual key for the yellow circle marker. |
| `depth` | `number` | Must stay above terrain tiles. |

**Relationships**

- Anchored to the occupied tile rather than to a terrain type.
- Rendered after terrain art so it remains readable.

**Validation rules**

- Exactly one party marker is visible on the world map at a time.
- The marker must stay centered on the occupied tile as the party moves.
- The marker depth must be greater than the terrain tile depth.

## State Transitions

### Tile presentation lifecycle

1. **Generated**: The world map creates a presentation entry for each visible tile.
2. **Frame 0**: The tile starts in its first animation state.
3. **Frame 1**: The tile switches to the alternate animation state after its phase-adjusted delay.
4. **Looping**: The tile continues alternating between the two frames while the scene is active.

### Party marker lifecycle

1. **Placed**: The marker is created on the party's occupied tile.
2. **Repositioned**: The marker moves when the party moves to a new hex.
3. **Persisted visually**: The marker stays visible above terrain art and does not inherit tile animation.

## Persistence Impact

- No new persistent fields are required.
- Existing `WorldMap` save data remains valid.
- The animation phase is derived at runtime, so loads do not need to restore frame state.
