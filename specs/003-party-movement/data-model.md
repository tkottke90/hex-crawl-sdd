# Data Model Changes — Unified Party Movement

Summary
- Add `deathMarkers: Array<{ coord: HexCoord, name: string }>` to the save schema so death markers persist across save/load.
- Add `worldMap.remainingTurnBudget: number` to transient world-map state; the value may be persisted if the design requires continuing mid-turn across saves.

Details

1. Save Schema
- `SaveFile` (existing) additions:
  - `deathMarkers?: { q:number, r:number, name: string }[]`
  - Optionally: `worldMap?: { remainingTurnBudget?: number }` (recommendation: persist `deathMarkers`, but recompute budget on load to avoid edge cases unless the product requires mid-turn save/restores).

2. Runtime State
- `WorldMapState` (in-memory):
  - `party: string[]` (IDs)
  - `remainingTurnBudget: number` (decrements on each move, resets on turn-boundary)
  - `deathMarkers: { coord: HexCoord, name: string }[]` (mirror of save for render)

3. APIs / Utilities
- `DeathMarkerStore` (module)
  - `addMarker(coord: HexCoord, name: string)`
  - `getMarkers(): Array<{coord,name}>`
  - `serialise(): SaveFormat` (for save)
  - `load(serialised)`

- `TurnBudgetManager` (module)
  - `resetBudget(partyMembers)` → computes `Math.max(MIN_PARTY_MOVE_RANGE, 1 + sum(dexMod))`
  - `consume(tiles: number)` → decrements remaining budget, clamps to 0
  - `getRemaining()`

4. Schema Migration Guidance
- On load, if occupants show party members on different tiles, move all non-PC occupants to PC tile.
- If `deathMarkers` absent, create empty array.

5. TypeScript Types (examples)
```ts
type HexCoord = { q:number, r:number };
interface DeathMarker { coord: HexCoord; name: string }
interface SaveFile { /* existing */ deathMarkers?: DeathMarker[]; worldMap?: { remainingTurnBudget?: number } }
```

Recommendation: persist `deathMarkers` but recompute `remainingTurnBudget` on load unless explicitly wanting to resume mid-turn.