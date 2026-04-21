# Contract: HexGridModule

**Consumers**: WorldMapScene, CombatScene, PathfindingService, MapGeneratorService

---

## Interface

```typescript
interface HexGridModule {
  // --- Coordinate utilities ---
  /** Returns the 6 cube-coordinate neighbours of a given coord */
  neighbors(coord: HexCoord): HexCoord[];
  /** Cube distance between two hex coords: max(|Δq|,|Δr|,|Δs|) */
  distance(a: HexCoord, b: HexCoord): number;
  /** Convert cube coord to Phaser pixel position (tile center) */
  toPixel(coord: HexCoord, tileSize: number): { x: number; y: number };
  /** Convert Phaser pixel position to nearest cube coord (rounded) */
  fromPixel(x: number, y: number, tileSize: number): HexCoord;

  // --- Map access ---
  /** Get a tile by coord; returns null if out of bounds or not generated */
  getTile(coord: HexCoord): HexTile | null;
  /** Returns all tiles matching a predicate */
  queryTiles(predicate: (tile: HexTile) => boolean): HexTile[];

  // --- Pathfinding ---
  /** A* path from start to end respecting moveCost and passability */
  findPath(start: HexCoord, end: HexCoord): HexCoord[] | null;
  /** BFS flood-fill returning all tiles reachable within movePoints budget */
  reachableTiles(origin: HexCoord, movePoints: number): HexTile[];

  // --- Mutation ---
  /** Move a character occupant from one tile to another */
  moveOccupant(characterId: string, from: HexCoord, to: HexCoord): void;
  /** Mark a tile as explored and remove fog of war */
  exploreTile(coord: HexCoord): void;
}
```

---

## Events Emitted

| Event | Payload | When |
|---|---|---|
| `tile:explored` | `{ coord: HexCoord }` | A tile's fog of war is lifted |
| `occupant:moved` | `{ characterId: string, from: HexCoord, to: HexCoord }` | Character moves between tiles |

---

## Constraints

- MUST NOT reference `CombatModule` or `SaveModule` internals.
- Pixel ↔ coord conversion MUST be pure functions (no Phaser scene access).
- All `HexCoord` values created by this module MUST satisfy `q + r + s === 0`; construction helpers MUST assert this invariant.
- `findPath` returns `null` when no path exists; it MUST NOT throw.
