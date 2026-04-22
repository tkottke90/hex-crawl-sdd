import { toPixel } from '../hex-grid/HexCoordUtils';
import type { HexCoord, TerrainType } from '../../models/hex';

export const ANIMATION_ENABLED = false;
export const TILE_DISPLAY_SIZE = 72;
export const TILE_TEXTURE_SIZE = 256;
export const TILE_ANIMATION_CYCLE_MS = 2000;
export const TILE_FRAME_COUNT = 2;

export type TileFrameIndex = 0 | 1;

export function terrainFrameKey(terrain: TerrainType, frameIndex: TileFrameIndex): string {
  return `tile-${terrain}-frame-${frameIndex + 1}`;
}

export function tilePhaseOffsetMs(coord: HexCoord): number {
  const raw = Math.abs((coord.q * 31) + (coord.r * 17) + (coord.s * 13));
  return raw % TILE_ANIMATION_CYCLE_MS;
}

export function tileFrameIndexAtTime(coord: HexCoord, timeMs: number): TileFrameIndex {
  const cycle = TILE_ANIMATION_CYCLE_MS;
  const frameDuration = cycle / TILE_FRAME_COUNT;
  const offset = tilePhaseOffsetMs(coord);
  const phase = (timeMs + offset) % cycle;
  return (Math.floor(phase / frameDuration) % TILE_FRAME_COUNT) as TileFrameIndex;
}

export function tileDisplayScale(): number {
  return TILE_DISPLAY_SIZE / TILE_TEXTURE_SIZE;
}

export function partyMarkerWorldPosition(coord: HexCoord): { x: number; y: number } {
  return toPixel(coord, TILE_DISPLAY_SIZE);
}

export function partyMarkerDisplaySize(): number {
  return TILE_DISPLAY_SIZE * 2 * 0.58;
}

export function partyMarkerDepth(): number {
  return 10;
}