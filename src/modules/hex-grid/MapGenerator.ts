import type { WorldMap } from '../../models/world-map';
import type { HexTile, TerrainType } from '../../models/hex';
import { createNoise2D } from '../../utils/noise';

function tileKey(q: number, r: number, s: number): string {
  return `${q},${r},${s}`;
}

function biome(elevation: number, moisture: number): TerrainType {
  if (elevation < 0.25) return 'ocean';
  if (elevation < 0.30) return 'beach';
  if (elevation > 0.85) return 'snow';
  if (elevation > 0.70) return 'mountain';
  if (moisture > 0.65) return 'forest';
  if (moisture < 0.30) return 'desert';
  return 'grassland';
}

function moveCost(terrain: TerrainType): number {
  switch (terrain) {
    case 'mountain': return 3;
    case 'forest': return 2;
    default: return 1;
  }
}

/**
 * Generate a hex map using two noise passes (elevation + moisture).
 * Island shaping: distance from centre reduces elevation, creating ocean borders.
 */
export function generateMap(seed: string, width: number, height: number): WorldMap {
  const elevationNoise = createNoise2D(`${seed}:elevation`);
  const moistureNoise = createNoise2D(`${seed}:moisture`);

  const tiles: Record<string, HexTile> = {};
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const maxDist = Math.min(cx, cy) * 0.9;

  let passableStart: { q: number; r: number; s: number } | null = null;

  for (let r = 0; r < height; r++) {
    // Offset for rectangular hex grid (axial coords)
    const qOffset = Math.floor(r / 2);
    for (let qi = 0; qi < width; qi++) {
      const q = qi - qOffset;
      const s = -q - r;

      // Normalised distance from centre for island shaping
      const dx = qi - cx;
      const dy = r - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;

      const rawElev = elevationNoise(q * 0.1, r * 0.1);
      const elevation = Math.max(0, rawElev - dist * 0.6);
      const moisture = moistureNoise(q * 0.1, r * 0.1);

      const terrain = biome(elevation, moisture);
      const passable = terrain !== 'ocean';
      const cost = moveCost(terrain);

      const coord = { q, r, s };
      tiles[tileKey(q, r, s)] = {
        coord,
        terrain,
        passable,
        moveCost: cost,
        poiTag: 'empty',
        occupants: [],
        fogOfWar: true,
        explored: false,
      };

      if (passable && passableStart === null) {
        passableStart = { q, r, s };
      }
    }
  }

  // Fallback: if somehow no passable tile found, use origin area
  if (!passableStart) {
    passableStart = { q: 0, r: 0, s: 0 };
    tiles[tileKey(0, 0, 0)] = {
      coord: { q: 0, r: 0, s: 0 },
      terrain: 'grassland',
      passable: true,
      moveCost: 1,
      poiTag: 'empty',
      occupants: [],
      fogOfWar: true,
      explored: false,
    };
  }

  return {
    seed,
    width,
    height,
    tiles,
    towns: [],
    enemyCamps: [],
    playerStartCoord: passableStart,
  };
}
