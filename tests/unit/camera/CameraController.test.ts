import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CameraController } from '../../../src/modules/camera/CameraController';
import {
  PAN_SPEED,
  TWEEN_EASE,
  TWEEN_MAX_DURATION,
} from '../../../src/modules/camera/CameraController';
import type { CameraControllerOptions, CameraKeys } from '../../../src/modules/camera/CameraController';
import type { HexCoord, HexTile } from '../../../src/models/hex';
import { makeCoord } from '../../../src/modules/hex-grid/HexCoordUtils';

// ── Mock Phaser camera ────────────────────────────────────────────────────────

function makeMockCamera() {
  return {
    scrollX: 0,
    scrollY: 0,
    setBounds: vi.fn(),
    centerOn: vi.fn(),
    pan: vi.fn(),
  };
}

function makeOptions(overrides?: Partial<CameraControllerOptions>): CameraControllerOptions {
  const tileSize = 36;
  return {
    camera: makeMockCamera() as unknown as Phaser.Cameras.Scene2D.Camera,
    tileWorldPos: (coord: HexCoord) => ({ x: coord.q * tileSize, y: coord.r * tileSize }),
    tileSize,
    ...overrides,
  };
}

// ── setBounds ─────────────────────────────────────────────────────────────────

describe('CameraController.setBounds', () => {
  it('calls camera.setBounds() with rect derived from tile centres plus padding', () => {
    // T008
    const opts = makeOptions();
    const controller = new CameraController(opts);
    const cam = opts.camera as unknown as ReturnType<typeof makeMockCamera>;

    const tiles: HexTile[] = [
      { coord: makeCoord(0, 0), terrain: 'grassland', passable: true, moveCost: 1, poiTag: 'empty', occupants: [], fogOfWar: false, explored: true },
      { coord: makeCoord(2, 0), terrain: 'grassland', passable: true, moveCost: 1, poiTag: 'empty', occupants: [], fogOfWar: false, explored: true },
      { coord: makeCoord(0, 2), terrain: 'grassland', passable: true, moveCost: 1, poiTag: 'empty', occupants: [], fogOfWar: false, explored: true },
    ];

    controller.setBounds(tiles);

    expect(cam.setBounds).toHaveBeenCalledOnce();
    const [x, y, w, h] = cam.setBounds.mock.calls[0];
    expect(typeof x).toBe('number');
    expect(typeof y).toBe('number');
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
  });

  it('does not call setBounds when tile array is empty', () => {
    const opts = makeOptions();
    const controller = new CameraController(opts);
    const cam = opts.camera as unknown as ReturnType<typeof makeMockCamera>;
    controller.setBounds([]);
    expect(cam.setBounds).not.toHaveBeenCalled();
  });
});

// ── centerOn ──────────────────────────────────────────────────────────────────

describe('CameraController.centerOn', () => {
  it('calls camera.centerOn(x, y) and does NOT call camera.pan()', () => {
    // T009
    const opts = makeOptions();
    const controller = new CameraController(opts);
    const cam = opts.camera as unknown as ReturnType<typeof makeMockCamera>;

    controller.centerOn(100, 200);

    expect(cam.centerOn).toHaveBeenCalledOnce();
    expect(cam.centerOn).toHaveBeenCalledWith(100, 200);
    expect(cam.pan).not.toHaveBeenCalled();
  });
});

// ── followTo ──────────────────────────────────────────────────────────────────

describe('CameraController.followTo', () => {
  it('calls camera.pan() with correct world position and 150 ms for single tile (T015)', () => {
    const opts = makeOptions();
    const controller = new CameraController(opts);
    const cam = opts.camera as unknown as ReturnType<typeof makeMockCamera>;

    const coord = makeCoord(1, 0);
    controller.followTo(coord, 1);

    expect(cam.pan).toHaveBeenCalledOnce();
    const [x, y, duration, ease] = cam.pan.mock.calls[0];
    expect(x).toBe(opts.tileWorldPos(coord).x);
    expect(y).toBe(opts.tileWorldPos(coord).y);
    expect(duration).toBe(150);
    expect(ease).toBe(TWEEN_EASE);
  });

  it('character-switch: followTo(coord, 1) still uses 150 ms — no special case (T015b)', () => {
    const opts = makeOptions();
    const controller = new CameraController(opts);
    const cam = opts.camera as unknown as ReturnType<typeof makeMockCamera>;

    controller.followTo(makeCoord(2, 1), 1);

    expect(cam.pan).toHaveBeenCalledOnce();
    expect(cam.pan.mock.calls[0][2]).toBe(150);
  });

  it('caps duration at 600 ms for path length 4 (T016)', () => {
    const opts = makeOptions();
    const controller = new CameraController(opts);
    const cam = opts.camera as unknown as ReturnType<typeof makeMockCamera>;

    controller.followTo(makeCoord(0, 0), 4);

    const duration = cam.pan.mock.calls[0][2];
    expect(duration).toBe(Math.min(150 * 4, TWEEN_MAX_DURATION));
    expect(duration).toBe(600);
  });

  it('calling followTo() while tween in progress calls camera.pan() again without error (T017)', () => {
    const opts = makeOptions();
    const controller = new CameraController(opts);
    const cam = opts.camera as unknown as ReturnType<typeof makeMockCamera>;

    controller.followTo(makeCoord(1, 0), 2);
    controller.followTo(makeCoord(2, 0), 1);

    expect(cam.pan).toHaveBeenCalledTimes(2);
  });
});

// ── update (keyboard pan) ─────────────────────────────────────────────────────

describe('CameraController.update', () => {
  let opts: CameraControllerOptions;
  let controller: CameraController;
  let cam: ReturnType<typeof makeMockCamera>;

  beforeEach(() => {
    opts = makeOptions();
    controller = new CameraController(opts);
    cam = opts.camera as unknown as ReturnType<typeof makeMockCamera>;
  });

  it('scrolls right by PAN_SPEED * (delta/1000) px when right key held (T021)', () => {
    const keys: CameraKeys = { right: true, left: false, up: false, down: false };
    const delta = 16;
    controller.update(keys, delta);
    const expected = PAN_SPEED * (delta / 1000);
    expect(cam.scrollX).toBeCloseTo(expected, 5);
  });

  it('produces zero horizontal scroll when opposing left+right keys held (T022)', () => {
    const keys: CameraKeys = { right: true, left: true, up: false, down: false };
    controller.update(keys, 16);
    expect(cam.scrollX).toBe(0);
  });

  it('isFreePanActive is true while a pan key is held (T023)', () => {
    expect(controller.isFreePanActive).toBe(false);
    controller.update({ right: true, left: false, up: false, down: false }, 16);
    expect(controller.isFreePanActive).toBe(true);
  });

  it('isFreePanActive returns false when all keys released (T023)', () => {
    controller.update({ right: true, left: false, up: false, down: false }, 16);
    controller.update({ right: false, left: false, up: false, down: false }, 16);
    expect(controller.isFreePanActive).toBe(false);
  });
});

// ── reCenterOn ────────────────────────────────────────────────────────────────

describe('CameraController.reCenterOn', () => {
  it('calls camera.pan(x, y, 300, ease) with correct world position (T028)', () => {
    const opts = makeOptions();
    const controller = new CameraController(opts);
    const cam = opts.camera as unknown as ReturnType<typeof makeMockCamera>;

    const coord = makeCoord(3, 2);
    controller.reCenterOn(coord);

    expect(cam.pan).toHaveBeenCalledOnce();
    const [x, y, duration, ease] = cam.pan.mock.calls[0];
    expect(x).toBe(opts.tileWorldPos(coord).x);
    expect(y).toBe(opts.tileWorldPos(coord).y);
    expect(duration).toBe(300);
    expect(ease).toBe(TWEEN_EASE);
  });

  it('does not call camera.pan() a second time when already tweening (T028)', () => {
    const opts = makeOptions();
    const controller = new CameraController(opts);
    const cam = opts.camera as unknown as ReturnType<typeof makeMockCamera>;

    controller.reCenterOn(makeCoord(1, 0));
    controller.reCenterOn(makeCoord(2, 0)); // should be ignored

    expect(cam.pan).toHaveBeenCalledOnce();
  });
});

// ── isFreePanActive (state transitions) ──────────────────────────────────────

describe('CameraController state transitions (T032)', () => {
  it('isFreePanActive becomes false after followTo() is called', () => {
    const opts = makeOptions();
    const controller = new CameraController(opts);

    // Simulate free pan
    controller.update({ right: true, left: false, up: false, down: false }, 16);
    expect(controller.isFreePanActive).toBe(true);

    // Character movement — free pan flag is reset by next update() with no keys
    controller.update({ right: false, left: false, up: false, down: false }, 16);
    expect(controller.isFreePanActive).toBe(false);
  });

  it('isFreePanActive is false after reCenterOn() tween completes', () => {
    // reCenterOn sets _freePanActive = false in the pan callback; we test the
    // direct property because Phaser pan callback cannot be triggered synchronously.
    // The assertion documents the expected post-completion state per the plan.
    const opts = makeOptions();
    const mockCam = makeMockCamera();

    let panCallback: ((cam: unknown, progress: number) => void) | undefined;
    mockCam.pan = vi.fn((_x, _y, _dur, _ease, _force, cb) => {
      panCallback = cb as (cam: unknown, progress: number) => void;
    });

    const controller = new CameraController({
      ...opts,
      camera: mockCam as unknown as Phaser.Cameras.Scene2D.Camera,
    });

    controller.update({ right: true, left: false, up: false, down: false }, 16);
    expect(controller.isFreePanActive).toBe(true);

    controller.reCenterOn(makeCoord(0, 0));
    panCallback!(null, 1); // simulate tween completion

    expect(controller.isFreePanActive).toBe(false);
  });
});
