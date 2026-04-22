import * as Phaser from 'phaser';
import { FANTASY_PALETTE } from '../../data/palette';
import type { TerrainType } from '../../models/hex';
import { TILE_TEXTURE_SIZE, terrainFrameKey } from '../../modules/world-map';

function hexPoints(size: number): Phaser.Math.Vector2[] {
  const center = size / 2;
  const radius = size * 0.46;
  const points: Phaser.Math.Vector2[] = [];

  for (let index = 0; index < 6; index += 1) {
    const angle = ((60 * index) - 30) * (Math.PI / 180);
    points.push(new Phaser.Math.Vector2(
      center + (radius * Math.cos(angle)),
      center + (radius * Math.sin(angle)),
    ));
  }

  return points;
}

function drawTerrainDetails(
  gfx: Phaser.GameObjects.Graphics,
  terrain: TerrainType,
  frame: 0 | 1,
  size: number,
  accentColor: number,
): void {
  const center = size / 2;
  const shift = frame === 0 ? -8 : 8;

  switch (terrain) {
    case 'ocean':
      gfx.fillStyle(accentColor, 0.3);
      gfx.fillCircle(center - 48 + shift, center - 12, 16);
      gfx.fillCircle(center - 4 - shift, center + 8, 14);
      gfx.fillCircle(center + 42 + shift, center - 2, 16);
      gfx.fillStyle(0xffffff, 0.18);
      gfx.fillCircle(center - 30 - shift, center + 26, 6);
      gfx.fillCircle(center + 20 + shift, center - 28, 5);
      break;

    case 'beach':
      gfx.fillStyle(accentColor, 0.34);
      gfx.fillCircle(center - 48 + shift, center + 12, 18);
      gfx.fillCircle(center - 2 - shift, center + 24, 16);
      gfx.fillCircle(center + 46 + shift, center + 14, 18);
      gfx.fillStyle(0xffffff, 0.2);
      gfx.fillCircle(center - 18 - shift, center - 20, 7);
      gfx.fillCircle(center + 24 + shift, center - 12, 6);
      break;

    case 'grassland':
      gfx.fillStyle(accentColor, 0.36);
      gfx.fillCircle(center - 42 + shift, center + 14, 16);
      gfx.fillCircle(center - 8 - shift, center - 18, 12);
      gfx.fillCircle(center + 28 + shift, center + 10, 18);
      gfx.fillStyle(0xf7f1b5, 0.24);
      gfx.fillCircle(center - 10 + shift, center + 26, 5);
      gfx.fillCircle(center + 36 - shift, center - 22, 4);
      break;

    case 'forest':
      gfx.fillStyle(accentColor, 0.9);
      gfx.fillRect(center - 46 + shift, center + 10, 8, 30);
      gfx.fillRect(center - 2 - shift, center - 10, 8, 34);
      gfx.fillRect(center + 38 + shift, center + 4, 8, 28);
      gfx.fillCircle(center - 42 + shift, center - 2, 18);
      gfx.fillCircle(center + 2 - shift, center - 20, 20);
      gfx.fillCircle(center + 44 + shift, center - 6, 18);
      break;

    case 'desert':
      gfx.fillStyle(accentColor, 0.28);
      gfx.fillTriangle(center - 56 + shift, center + 12, center - 24 + shift, center - 18, center + 10 + shift, center + 12);
      gfx.fillTriangle(center - 8 - shift, center + 22, center + 24 - shift, center - 10, center + 58 - shift, center + 22);
      gfx.fillStyle(0xfff0bf, 0.18);
      gfx.fillCircle(center - 18 - shift, center - 24, 6);
      gfx.fillCircle(center + 30 + shift, center - 16, 5);
      break;

    case 'mountain':
      gfx.fillStyle(accentColor, 0.72);
      gfx.fillTriangle(center - 52 + shift, center + 22, center - 12 + shift, center - 36, center + 28 + shift, center + 22);
      gfx.fillTriangle(center - 4 - shift, center + 28, center + 30 - shift, center - 44, center + 66 - shift, center + 28);
      gfx.fillStyle(0xf4f1ea, 0.55);
      gfx.fillTriangle(center - 20 + shift, center - 30, center - 12 + shift, center - 44, center - 4 + shift, center - 30);
      gfx.fillTriangle(center + 14 - shift, center - 34, center + 26 - shift, center - 48, center + 38 - shift, center - 34);
      break;

    case 'snow':
      gfx.fillStyle(accentColor, 0.76);
      gfx.fillTriangle(center - 56 + shift, center + 20, center - 18 + shift, center - 38, center + 20 + shift, center + 20);
      gfx.fillTriangle(center - 2 - shift, center + 26, center + 34 - shift, center - 36, center + 70 - shift, center + 26);
      gfx.fillStyle(0xffffff, 0.7);
      gfx.fillCircle(center - 24 + shift, center - 18, 7);
      gfx.fillCircle(center + 32 - shift, center - 14, 6);
      gfx.fillCircle(center + 2, center + 20, 5);
      break;
  }
}

function drawTerrainTexture(
  gfx: Phaser.GameObjects.Graphics,
  terrain: TerrainType,
  baseColor: number,
  accentColor: number,
  frame: 0 | 1,
  size: number,
): void {
  const points = hexPoints(size);

  gfx.clear();
  gfx.fillStyle(baseColor, 1);
  gfx.fillPoints(points, true);
  gfx.lineStyle(4, accentColor, 0.35);
  gfx.strokePoints(points, true);
  drawTerrainDetails(gfx, terrain, frame, size, accentColor);
}

/**
 * Boot scene: registers all asset keys.
 * Placeholder colored tiles (32×32) are generated procedurally for v1.
 */
export class Boot extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    // Generate larger terrain textures with two animation frames per terrain type.
    const terrainColors: Record<TerrainType, number> = {
      ocean:     parseInt(FANTASY_PALETTE.oceanBlue.slice(1), 16),
      beach:     parseInt(FANTASY_PALETTE.sandBeige.slice(1), 16),
      grassland: parseInt(FANTASY_PALETTE.forestGreen.slice(1), 16),
      forest:    0x1a3a10,
      desert:    parseInt(FANTASY_PALETTE.earth.slice(1), 16),
      mountain:  parseInt(FANTASY_PALETTE.mountainBrown.slice(1), 16),
      snow:      parseInt(FANTASY_PALETTE.snowWhite.slice(1), 16),
    };

    const terrainAccents: Record<TerrainType, number> = {
      ocean: 0x74c7f2,
      beach: 0xfff1bb,
      grassland: 0xd6f2a3,
      forest: 0x4a7a2b,
      desert: 0xd9b36a,
      mountain: 0xc9c3b7,
      snow: 0xe7f3ff,
    };

    for (const [name, color] of Object.entries(terrainColors)) {
      const terrain = name as TerrainType;

      for (const frame of [0, 1] as const) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        drawTerrainTexture(gfx, terrain, color, terrainAccents[terrain], frame, TILE_TEXTURE_SIZE);
        gfx.generateTexture(terrainFrameKey(terrain, frame), TILE_TEXTURE_SIZE, TILE_TEXTURE_SIZE);
        gfx.destroy();
      }
    }

    // Character placeholder
    const charGfx = this.make.graphics({ x: 0, y: 0 });
    charGfx.fillStyle(0xffd700, 1);
    charGfx.fillCircle(16, 16, 14);
    charGfx.generateTexture('char-pc', 32, 32);
    charGfx.destroy();

    const escortGfx = this.make.graphics({ x: 0, y: 0 });
    escortGfx.fillStyle(0x87ceeb, 1);
    escortGfx.fillCircle(16, 16, 14);
    escortGfx.generateTexture('escort', 32, 32);
    escortGfx.destroy();

    this.scene.start('Preloader');
  }
}
