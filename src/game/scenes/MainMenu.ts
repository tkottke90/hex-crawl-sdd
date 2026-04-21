import * as Phaser from 'phaser';
import { BASE_CLASSES } from '../../data/classes';
import type { GameModeType } from '../../models/save';
import { createSaveModule } from '../../modules/save';
import { Toast } from '../ui/Toast';

const { module: saveModule } = createSaveModule();

/**
 * MainMenu scene: New Game → mode select → class select → emit game:start.
 * Load Game and Import Save buttons are present (wired in T069).
 */
export class MainMenu extends Phaser.Scene {
  private overlay: HTMLDivElement | null = null;

  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    this.checkForExistingSaves().then((hasSave) => this.showMenu(hasSave));
  }

  private async checkForExistingSaves(): Promise<boolean> {
    const slots = await saveModule.listSaves();
    return slots.length > 0;
  }

  private showMenu(hasSave = false): void {
    this.clearOverlay();
    const el = document.createElement('div');
    el.id = 'main-menu';
    el.className = 'fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-40';
    el.innerHTML = `
      <h1 class="text-yellow-400 text-5xl font-bold mb-12 tracking-widest">HEX CRAWL</h1>
      <div class="flex flex-col gap-4 w-64">
        <button id="btn-new-game" class="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg text-lg">
          New Game
        </button>
        <button id="btn-load-game" class="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg text-lg" ${hasSave ? '' : 'disabled'}>
          Load Game
        </button>
        <button id="btn-import-save" class="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg text-lg">
          Import Save
        </button>
      </div>
    `;
    document.body.appendChild(el);
    this.overlay = el;

    document.getElementById('btn-new-game')!.addEventListener('click', () => this.showModeSelect());

    if (hasSave) {
      document.getElementById('btn-load-game')!.addEventListener('click', () => this.loadMostRecentSave());
    }

    document.getElementById('btn-import-save')!.addEventListener('click', () => this.promptImportSave());
  }

  private async loadMostRecentSave(): Promise<void> {
    const save = await saveModule.loadFromStorage();
    if (!save) {
      console.warn('No save found.');
      return;
    }
    this.clearOverlay();
    this.registry.set('saveState', save);
    this.registry.set('gameMode', save.gameMode.type);
    this.scene.start('WorldMap');
  }

  private promptImportSave(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const save = await saveModule.importFromFile(file);
        this.clearOverlay();
        this.registry.set('saveState', save);
        this.registry.set('gameMode', save.gameMode.type);
        this.scene.start('WorldMap');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.showImportError(msg);
      }
    };
    input.click();
  }

  private showImportError(_message: string): void {
    Toast.show('Save file is incompatible or corrupted', 'error', 4000);
  }

  private showModeSelect(): void {
    this.clearOverlay();
    const el = document.createElement('div');
    el.id = 'mode-select';
    el.className = 'fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-40';
    el.innerHTML = `
      <h2 class="text-white text-3xl font-bold mb-8">Choose Mode</h2>
      <div class="flex gap-6">
        <button id="btn-casual" class="bg-green-600 hover:bg-green-500 text-white font-bold py-6 px-10 rounded-xl text-xl flex flex-col items-center">
          <span>CASUAL</span>
          <span class="text-sm font-normal mt-2 opacity-75">Save-scumming allowed</span>
        </button>
        <button id="btn-roguelike" class="bg-red-700 hover:bg-red-600 text-white font-bold py-6 px-10 rounded-xl text-xl flex flex-col items-center">
          <span>ROGUELIKE</span>
          <span class="text-sm font-normal mt-2 opacity-75">PC/Escort death is permanent</span>
        </button>
      </div>
      <button id="btn-back-mode" class="mt-8 text-gray-500 hover:text-white">← Back</button>
    `;
    document.body.appendChild(el);
    this.overlay = el;

    document.getElementById('btn-casual')!.addEventListener('click', () => this.showClassSelect('casual'));
    document.getElementById('btn-roguelike')!.addEventListener('click', () => this.showClassSelect('roguelike'));
    document.getElementById('btn-back-mode')!.addEventListener('click', () => this.showMenu());
  }

  private showClassSelect(mode: GameModeType): void {
    this.clearOverlay();
    const el = document.createElement('div');
    el.id = 'class-select';
    el.className = 'fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-40 overflow-auto py-8';

    const cards = BASE_CLASSES.map((cls) => `
      <button
        data-class-id="${cls.id}"
        class="class-card bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-yellow-400 text-white rounded-xl p-6 w-44 flex flex-col items-center gap-2 transition-all"
      >
        <span class="text-yellow-400 text-xl font-bold">${cls.name}</span>
        <span class="text-xs text-gray-400 uppercase">${cls.tier}</span>
        <div class="text-xs mt-2 space-y-1 text-left w-full">
          <div>STR <span class="text-yellow-300">${cls.baseStats.str}</span></div>
          <div>DEX <span class="text-yellow-300">${cls.baseStats.dex}</span></div>
          <div>CON <span class="text-yellow-300">${cls.baseStats.con}</span></div>
          <div>INT <span class="text-yellow-300">${cls.baseStats.int}</span></div>
        </div>
        <div class="text-xs text-gray-400 mt-1">HP: ${cls.maxHpBase} | Move: ${cls.moveRange}</div>
      </button>
    `).join('');

    el.innerHTML = `
      <h2 class="text-white text-3xl font-bold mb-6">Choose Your Class</h2>
      <p class="text-gray-400 mb-6 text-sm">${mode === 'casual' ? '🟢 CASUAL' : '🔴 ROGUELIKE'} mode</p>
      <div class="flex gap-4 flex-wrap justify-center px-4">${cards}</div>
      <button id="btn-back-class" class="mt-8 text-gray-500 hover:text-white">← Back</button>
    `;
    document.body.appendChild(el);
    this.overlay = el;

    el.querySelectorAll('.class-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const classId = (btn as HTMLElement).dataset.classId!;
        this.startGame(mode, classId);
      });
    });

    document.getElementById('btn-back-class')!.addEventListener('click', () => this.showModeSelect());
  }

  private startGame(mode: GameModeType, classId: string): void {
    this.clearOverlay();
    this.registry.set('gameMode', mode);
    this.registry.set('playerClassId', classId);
    this.scene.start('WorldMap');
  }

  private clearOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  shutdown(): void {
    this.clearOverlay();
  }
}
