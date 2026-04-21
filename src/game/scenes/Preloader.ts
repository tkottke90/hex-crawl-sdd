import * as Phaser from 'phaser';

/**
 * Preloader scene: shows a Tailwind-styled progress overlay while assets load.
 * For v1, assets are procedurally generated so this transitions immediately.
 */
export class Preloader extends Phaser.Scene {
  private overlay: HTMLDivElement | null = null;

  constructor() {
    super({ key: 'Preloader' });
  }

  preload(): void {
    this.showOverlay();
    this.load.on('progress', (value: number) => this.updateProgress(value));
    this.load.on('complete', () => this.hideOverlay());
    // No external files to load in v1 — all assets are generated in Boot
  }

  create(): void {
    this.hideOverlay();
    this.scene.start('MainMenu');
  }

  private showOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'preloader-overlay';
    this.overlay.className = 'fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-50';
    this.overlay.innerHTML = `
      <h1 class="text-white text-3xl font-bold mb-8">Hex Crawl</h1>
      <div class="w-64 h-3 bg-gray-700 rounded-full overflow-hidden">
        <div id="preloader-bar" class="h-full bg-yellow-400 transition-all duration-200" style="width:0%"></div>
      </div>
      <p id="preloader-pct" class="text-gray-400 mt-3 text-sm">Loading…</p>
    `;
    document.body.appendChild(this.overlay);
  }

  private updateProgress(value: number): void {
    const bar = document.getElementById('preloader-bar');
    const pct = document.getElementById('preloader-pct');
    if (bar) bar.style.width = `${Math.round(value * 100)}%`;
    if (pct) pct.textContent = `${Math.round(value * 100)}%`;
  }

  private hideOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  shutdown(): void {
    this.hideOverlay();
  }
}
