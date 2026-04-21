import type { HexCoord, HexTile } from '../../models/hex';
import { toPixel } from '../hex-grid/HexCoordUtils';

// ── Constants ────────────────────────────────────────────────────────────────

/** Pixel size of one hex tile (centre to vertex). Matches WorldMap.ts. */
export const TILE_SIZE = 36;

/**
 * Manual keyboard pan speed in pixels per second.
 * Spec FR-007: 5 tiles/sec × TILE_SIZE.
 */
export const PAN_SPEED = 5 * TILE_SIZE; // 180

/**
 * Camera boundary padding (px) added around the map bounding box
 * so the edge tiles are not flush with the screen boundary.
 */
export const CAM_BOUND_PADDING = TILE_SIZE * 2; // 72

/**
 * Follow tween duration per tile step (ms).
 * Spec FR-003: single-tile ≤ 400 ms; multi-tile linear scale capped at 600 ms.
 */
export const TWEEN_DURATION_PER_TILE = 150;

/** Maximum tween duration regardless of path length (ms). Spec FR-003. */
export const TWEEN_MAX_DURATION = 600;

/** Easing applied to all camera follow and re-center tweens. Spec FR-003. */
export const TWEEN_EASE = 'Quad.easeOut';

// ── Types ────────────────────────────────────────────────────────────────────

export type CameraMode = 'follow' | 'free-pan';

export interface CameraKeys {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface CameraControllerOptions {
  camera: Phaser.Cameras.Scene2D.Camera;
  /** Tile lookup: returns world-space pixel centre of a HexCoord. */
  tileWorldPos: (coord: HexCoord) => { x: number; y: number };
  /** Phaser TILE_SIZE in pixels. */
  tileSize: number;
}

// ── Implementation ───────────────────────────────────────────────────────────

export class CameraController {
  private readonly _camera: Phaser.Cameras.Scene2D.Camera;
  private readonly _tileWorldPos: (coord: HexCoord) => { x: number; y: number };
  private readonly _tileSize: number;

  private _freePanActive = false;
  private _isTweening = false;

  constructor(options: CameraControllerOptions) {
    this._camera = options.camera;
    this._tileWorldPos = options.tileWorldPos;
    this._tileSize = options.tileSize;
  }

  /** Call once after scene tiles are rendered. Clamps camera to map bounds. */
  setBounds(tiles: HexTile[]): void {
    if (tiles.length === 0) return;

    const positions = tiles.map((t) => toPixel(t.coord, this._tileSize));
    const minX = Math.min(...positions.map((p) => p.x)) - CAM_BOUND_PADDING;
    const minY = Math.min(...positions.map((p) => p.y)) - CAM_BOUND_PADDING;
    const maxX = Math.max(...positions.map((p) => p.x)) + CAM_BOUND_PADDING;
    const maxY = Math.max(...positions.map((p) => p.y)) + CAM_BOUND_PADDING;

    this._camera.setBounds(minX, minY, maxX - minX, maxY - minY);
  }

  /** Center camera instantly on a world coordinate (used at scene init). */
  centerOn(x: number, y: number): void {
    this._camera.centerOn(x, y);
  }

  /** Smoothly pan to a tile with proper duration scaling. */
  followTo(coord: HexCoord, pathLength: number): void {
    const { x, y } = this._tileWorldPos(coord);
    const duration = Math.min(TWEEN_DURATION_PER_TILE * pathLength, TWEEN_MAX_DURATION);
    this._camera.pan(x, y, duration, TWEEN_EASE);
  }

  /** Re-center on a coord using a fixed 300 ms ease-out tween. */
  reCenterOn(coord: HexCoord): void {
    if (this._isTweening) return;
    this._isTweening = true;
    const { x, y } = this._tileWorldPos(coord);
    this._camera.pan(x, y, 300, TWEEN_EASE, false, (_cam, progress) => {
      if (progress === 1) {
        this._isTweening = false;
        this._freePanActive = false;
      }
    });
  }

  /**
   * Called each frame from WorldMap.update().
   * Handles keyboard pan — applies velocity directly to camera scrollX/scrollY.
   */
  update(keys: CameraKeys, delta: number): void {
    const speed = PAN_SPEED * (delta / 1000);
    const anyKey = keys.up || keys.down || keys.left || keys.right;
    this._freePanActive = anyKey;

    const dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);

    if (dx !== 0) this._camera.scrollX += dx * speed;
    if (dy !== 0) this._camera.scrollY += dy * speed;
  }

  /** True while any pan key is held (free-pan mode). */
  get isFreePanActive(): boolean {
    return this._freePanActive;
  }
}
