# Quickstart: World Map Terrain Detail

## Prerequisites

- Install dependencies with `npm install`.
- Use the existing feature branch `004-world-map-detail`.

## Run the feature locally

1. Start the dev server: `npm run dev`
2. Open the game in the browser and navigate to the world map.
3. Confirm that terrain is visually differentiated across the map.
4. Watch the map for a few seconds and verify that visible tiles alternate between two states with slight phase variation.
5. Confirm the party remains a readable yellow circle centered on its occupied hex.

## Validation commands

Run the targeted checks for this feature:

```bash
npm run test -- tests/unit/world-map
npm run test:e2e -- tests/e2e/smoke.spec.ts tests/e2e/perf-frametime.spec.ts
npm run build
```

For a full repository-level verification pass:

```bash
npm run validate
```

## Acceptance checklist

- The world map no longer looks like a uniform dark-blue grid.
- Each visible tile has a terrain-specific visual identity.
- Tile animation uses a two-step loop and does not sync into a single wave.
- The party marker stays above the tile art and remains centered on its hex.
- The automated render-analysis metric passes, and the perf test stays green.

## Notes

- The world map now renders tiles at 72px display size, which is exactly 2x the previous 36px footprint.
- The smoke test snapshot checks `tileDisplaySize`, `fogOfWarApplied`, terrain diversity, and the party marker world position.
- The frametime test still enforces the existing 33 ms frame budget while the visible tiles animate.
