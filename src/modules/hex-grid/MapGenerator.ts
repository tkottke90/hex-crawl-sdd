import type { WorldMap } from '../../models/world-map';
import type { HexTile, HexCoord, TerrainType } from '../../models/hex';
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

function isBorderTile(coord: HexCoord, width: number, height: number): boolean {
  const qi = coord.q + Math.floor(coord.r / 2);
  return coord.r < 2 || coord.r >= height - 2 || qi < 2 || qi >= width - 2;
}

function isInStartRegion(coord: HexCoord, width: number, height: number): boolean {
  const qi = coord.q + Math.floor(coord.r / 2);
  const qMin = Math.floor(width / 4);
  const qMax = width - Math.floor(width / 4);
  return coord.r >= Math.floor(height / 2) && qi >= qMin && qi < qMax;
}

/**
 * Generate a hex map using two noise passes (elevation + moisture).
 * Island shaping: distance from centre reduces elevation, creating ocean borders.
 * Post-processing: outer two tile-layers forced to ocean; player start placed in bottom-center region.
 */
export function generateMap(seed: string, width: number, height: number): WorldMap {
  const elevationNoise = createNoise2D(`${seed}:elevation`);
  const moistureNoise = createNoise2D(`${seed}:moisture`);

  const tiles: Record<string, HexTile> = {};
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const maxDist = Math.min(cx, cy) * 0.9;

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
    }
  }

  // T006: Border post-processing pass — force outer two tile-layers to impassable ocean
  for (const tile of Object.values(tiles)) {
    if (isBorderTile(tile.coord, width, height)) {
      tile.terrain = 'ocean';
      tile.passable = false;
      tile.moveCost = 1;
    }
  }

  // T009: Start region selection — pick passable tile closest to center-bottom
  const startCandidates = Object.values(tiles).filter(
    (tile) => tile.passable && isInStartRegion(tile.coord, width, height),
  );

  let playerStartCoord: HexCoord;
  if (startCandidates.length > 0) {
    const best = startCandidates.reduce((prev, curr) => {
      const pqi = prev.coord.q + Math.floor(prev.coord.r / 2);
      const cqi = curr.coord.q + Math.floor(curr.coord.r / 2);
      const pDist = Math.hypot(pqi - width / 2, prev.coord.r - (height - 1));
      const cDist = Math.hypot(cqi - width / 2, curr.coord.r - (height - 1));
      return cDist < pDist ? curr : prev;
    });
    playerStartCoord = best.coord;
  } else {
    // Fallback: force center-bottom tile to grassland
    const fallbackQi = Math.floor(width / 2);
    const fallbackR = height - 3;
    const fallbackQOffset = Math.floor(fallbackR / 2);
    const fallbackQ = fallbackQi - fallbackQOffset;
    const fallbackS = -fallbackQ - fallbackR;
    const fallbackKey = tileKey(fallbackQ, fallbackR, fallbackS);
    playerStartCoord = { q: fallbackQ, r: fallbackR, s: fallbackS };
    tiles[fallbackKey] = {
      coord: playerStartCoord,
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
    playerStartCoord,
  };
}
