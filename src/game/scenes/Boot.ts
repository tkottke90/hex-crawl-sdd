import * as Phaser from 'phaser';
import { FANTASY_PALETTE } from '../../data/palette';

/**
 * Boot scene: registers all asset keys.
 * Placeholder colored tiles (32×32) are generated procedurally for v1.
 */
export class Boot extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    // Generate placeholder 32×32 tile textures for each terrain type
    const terrainColors: Record<string, number> = {
      ocean:     parseInt(FANTASY_PALETTE.oceanBlue.slice(1), 16),
      beach:     parseInt(FANTASY_PALETTE.sandBeige.slice(1), 16),
      grassland: parseInt(FANTASY_PALETTE.forestGreen.slice(1), 16),
      forest:    0x1a3a10,
      desert:    parseInt(FANTASY_PALETTE.earth.slice(1), 16),
      mountain:  parseInt(FANTASY_PALETTE.mountainBrown.slice(1), 16),
      snow:      parseInt(FANTASY_PALETTE.snowWhite.slice(1), 16),
    };

    for (const [name, color] of Object.entries(terrainColors)) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(color, 1);
      gfx.fillRect(0, 0, 32, 32);
      gfx.generateTexture(`tile-${name}`, 32, 32);
      gfx.destroy();
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
