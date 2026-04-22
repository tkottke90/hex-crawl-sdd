# Contract: `generateMap` — Map Generator

**Feature**: `005-random-map-generation`  
**Module**: `src/modules/hex-grid/MapGenerator.ts`  
**Consumers**: `WorldMap` scene, unit tests

---

## Signature

```ts
function generateMap(seed: string, width: number, height: number): WorldMap
```

No change to the public signature. All behavior additions are internal.

---

## Guaranteed Postconditions (New in Feature 005)

### Water Border

```
∀ tile ∈ map.tiles where isBorderTile(tile.coord, width, height):
  tile.terrain === 'ocean'
  tile.passable === false
```

Where:
```ts
function isBorderTile(coord: HexCoord, width: number, height: number): boolean {
  const qi = coord.q + Math.floor(coord.r / 2);
  return coord.r < 2 || coord.r >= height - 2 || qi < 2 || qi >= width - 2;
}
```

### Start Region Constraint

```
let startCoord = map.playerStartCoord
let qi = startCoord.q + Math.floor(startCoord.r / 2)
let qMin = Math.floor(width / 4)
let qMax = width - Math.floor(width / 4)

startCoord.r >= Math.floor(height / 2)   // bottom half
qi >= qMin && qi < qMax                   // center horizontal half
map.tiles[key(startCoord)].passable === true
```

### Seed Uniqueness (caller responsibility)

The seed string MUST be unique per run. `generateMap` is a pure function — it does not generate the seed. It is the `WorldMap` scene's responsibility to supply a unique seed combining a timestamp and random component.

### Determinism (pre-existing guarantee, explicitly restated)

```
generateMap(s, w, h) === generateMap(s, w, h)   // for any s, w, h
```

Same seed, same dimensions → byte-identical `WorldMap` output.

---

## Invariants Preserved from Feature 001

- All `HexCoord` values satisfy `q + r + s === 0`.
- `map.playerStartCoord` always points to a tile that exists in `map.tiles` and is `passable: true`.
- All terrain values are members of `TerrainType`.

---

## Constraints

- `generateMap` MUST remain a pure function with no side effects.
- Border override MUST be applied before `playerStartCoord` selection.
- `generateMap` MUST NOT throw for any valid `width >= 5` and `height >= 5` input. (Maps smaller than 5×5 leave no inner zone after the 2-layer border; behavior is undefined.)
