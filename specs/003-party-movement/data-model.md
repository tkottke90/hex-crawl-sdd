# Data Model Changes — Unified Party Movement

Summary
- Add `deathMarkers: Array<{ coord: HexCoord, name: string }>` and `worldMap.remainingTurnBudget: number` to the save schema so both death markers and mid-turn movement progress persist across save/load.

Details

1. Save Schema
- `SaveFile` (existing) additions:
  - `deathMarkers?: { q:number, r:number, name: string }[]`
  - `worldMap?: { remainingTurnBudget: number }`

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
- If `deathMarkers` is absent, create an empty array.
- If `worldMap.remainingTurnBudget` is absent in a legacy save, initialise it to the full budget for the current party so old saves remain playable.

5. TypeScript Types (examples)
```ts
type HexCoord = { q:number, r:number };
interface DeathMarker { coord: HexCoord; name: string }
interface SaveFile { /* existing */ deathMarkers?: DeathMarker[]; worldMap?: { remainingTurnBudget: number } }
```

Recommendation: persist both `deathMarkers` and `remainingTurnBudget` so save/load round-trips preserve the exact world-map state; legacy saves without `remainingTurnBudget` should initialise it to the full turn budget for the current party.