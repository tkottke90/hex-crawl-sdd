# Contract: SaveModule

**Consumers**: GameLoop, MainMenuScene, UIOverlay

---

## Interface

```typescript
interface SaveModule {
  // --- Browser storage (IndexedDB via idb) ---
  /** Persist current game state to browser storage */
  saveToStorage(state: SaveState): Promise<SaveResult>;
  /** Load most recent save from browser storage; null if none */
  loadFromStorage(): Promise<SaveState | null>;
  /** List all save slots in browser storage */
  listSaves(): Promise<SaveSlotMeta[]>;
  /** Delete a save slot by id */
  deleteSave(saveId: string): Promise<void>;

  // --- Device file export/import ---
  /** Trigger browser file download of save as versioned JSON */
  exportToFile(state: SaveState): void;
  /** Parse and validate a File from device; runs migration + Zod validation */
  importFromFile(file: File): Promise<SaveState>;

  // --- Auto-save (Roguelike mode) ---
  /** Write auto-save checkpoint; silently overwrites previous auto-save */
  autoSave(state: SaveState): Promise<void>;
  /** Load the auto-save checkpoint; null if none */
  loadAutoSave(): Promise<SaveState | null>;
}

interface SaveResult {
  success: boolean;
  saveId: string;
  error?: string;
}

interface SaveSlotMeta {
  saveId: string;
  timestamp: string;
  gameMode: GameModeType;
  partySize: number;
  saveVersion: number;
}
```

---

## Events Emitted

| Event | Payload | When |
|---|---|---|
| `save:success` | `{ saveId: string }` | Any save write completes |
| `save:error` | `{ error: string }` | Any save write fails |
| `import:validation-error` | `{ error: string }` | Imported file fails Zod validation |

---

## Constraints

- ALL imported save files MUST be validated with Zod `safeParse` after migration runs (R-010).
- In Roguelike mode, `saveToStorage()` MUST NOT be exposed to the player — only `autoSave()` is called by GameLoop.
- `importFromFile()` MUST treat all input as untrusted (OWASP boundary validation).
- Save writes MUST be atomic where possible; use IndexedDB transactions to avoid partial writes.
- MUST NOT reference `CombatModule` or `HexGridModule` internals; it receives the full `SaveState` from GameLoop.
