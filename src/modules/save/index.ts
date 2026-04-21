import type { SaveState } from '../../models/save';
import { serialise, type GameStateInput } from './Serialiser';
import { migrate } from './Migrator';
import {
  saveToStorage,
  loadFromStorage,
  listSlots,
  deleteSave,
  autoSave,
  loadAutoSave,
  type SaveSlotMeta,
  type SaveResult,
} from './IndexedDbStore';
import { exportToFile, importFromFile } from './FileExporter';

export interface SaveModule {
  saveToStorage(state: SaveState): Promise<SaveResult>;
  loadFromStorage(saveId?: string): Promise<SaveState | null>;
  listSaves(): Promise<SaveSlotMeta[]>;
  deleteSave(saveId: string): Promise<void>;
  exportToFile(state: SaveState): void;
  importFromFile(file: File): Promise<SaveState>;
  autoSave(state: SaveState): Promise<void>;
  loadAutoSave(): Promise<SaveState | null>;
}

export function createSaveModule(): { module: SaveModule } {
  const module: SaveModule = {
    saveToStorage,
    loadFromStorage,
    listSaves: listSlots,
    deleteSave,
    exportToFile,
    importFromFile,
    autoSave,
    loadAutoSave,
  };
  return { module };
}

export { serialise, migrate };
export type { GameStateInput, SaveSlotMeta, SaveResult };
