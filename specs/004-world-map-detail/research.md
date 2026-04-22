# Research: World Map Terrain Detail

## R-001: How should tile animation run?

- **Decision**: Use independent per-tile animation with slight phase offsets, driven from the scene clock.
- **Rationale**: The map should feel alive, but a synchronized wave across every tile looks mechanical. A shared clock with tile-specific offsets keeps the motion varied without requiring per-tile timers or tweens.
- **Alternatives considered**:
  - Global synchronized frame switching: simpler, but visibly uniform and less natural.
  - Separate tween objects per tile: flexible, but too expensive for the number of visible hexes.

## R-002: How should terrain art be rendered?

- **Decision**: Render each hex with terrain-specific artwork using the existing terrain identity already attached to each `HexTile`.
- **Rationale**: The repository already computes terrain for the world map and already generates placeholder terrain textures in `Boot.ts`. Reusing that pipeline keeps the change focused on presentation.
- **Alternatives considered**:
  - Flat color fills with overlays: cheaper to implement, but does not meet the goal of a recognizable world map.
  - Rebuilding the entire map as custom vector art each frame: unnecessary and too costly.

## R-003: How should the party remain readable?

- **Decision**: Keep the party marker as a separate overlay layer with higher depth than the tile art.
- **Rationale**: Terrain art and animation can become visually busy, so the marker must stay legible regardless of the current tile frame.
- **Alternatives considered**:
  - Bake the party marker into tile art: makes movement and layering harder.
  - Draw the marker in the same depth as terrain: risks it being obscured by animated terrain detail.

## R-004: What performance safeguards are needed?

- **Decision**: Keep animation render-time only, avoid per-tile tweens, avoid per-frame vector redraws, and enforce a steady-state frametime budget in the e2e perf test.
- **Rationale**: The user explicitly called out performance as the main concern. This approach limits the runtime cost to cheap state selection and texture swaps.
- **Alternatives considered**:
  - Animated `Graphics` redraws per tile: too CPU-heavy for a full map.
  - Persisting animation state in saves: unnecessary because the feature is purely visual.

## R-005: Are schema or save changes required?

- **Decision**: No schema or save-file changes are needed for this feature.
- **Rationale**: The feature changes only how the map looks while it is running. The current terrain, party position, and save data already exist.
- **Alternatives considered**:
  - Add animation state to save data: not needed because the current visual phase can be derived after load.
