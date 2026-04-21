import { openDB, type IDBPDatabase } from 'idb';
import type { SaveState } from '../../models/save';
import type { GameModeType } from '../../models/save';

const DB_NAME = 'hex-crawl-v1';
const STORE_NAME = 'saves';

export interface SaveSlotMeta {
  saveId: string;
  timestamp: string;
  gameMode: GameModeType;
  partySize: number;
  saveVersion: number;
}

export interface SaveResult {
  success: boolean;
  saveId: string;
  error?: string;
}

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'saveId' });
      }
    },
  });
}

export async function saveToStorage(state: SaveState): Promise<SaveResult> {
  const saveId = `save_${Date.now()}`;
  const record = { saveId, ...state };
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.store.put(record);
    await tx.done;
    return { success: true, saveId };
  } catch (err) {
    const isQuotaError =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    const message = isQuotaError
      ? 'Browser storage full — export your save file'
      : err instanceof Error
        ? err.message
        : String(err);
    return { success: false, saveId: '', error: message };
  }
}

export async function loadFromStorage(saveId?: string): Promise<SaveState | null> {
  try {
    const db = await getDb();
    if (saveId) {
      const raw = await db.get(STORE_NAME, saveId);
      return raw ?? null;
    }
    // Load most recent
    const all = await db.getAll(STORE_NAME);
    if (all.length === 0) return null;
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return all[0] as SaveState;
  } catch {
    return null;
  }
}

export async function listSlots(): Promise<SaveSlotMeta[]> {
  try {
    const db = await getDb();
    const all = await db.getAll(STORE_NAME);
    return all.map((r) => ({
      saveId: r.saveId as string,
      timestamp: r.timestamp as string,
      gameMode: (r.gameMode as { type: GameModeType }).type,
      partySize: (r.party as unknown[]).length,
      saveVersion: r.version as number,
    }));
  } catch {
    return [];
  }
}

export async function deleteSave(saveId: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, saveId);
}

export async function autoSave(state: SaveState): Promise<void> {
  const record = { saveId: 'autosave', ...state };
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.put(record);
  await tx.done;
}

export async function loadAutoSave(): Promise<SaveState | null> {
  return loadFromStorage('autosave');
}
