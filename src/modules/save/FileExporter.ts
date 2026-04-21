import { SaveStateSchema } from '../../schemas/save.schema';
import { migrate } from './Migrator';
import type { SaveState } from '../../models/save';

export class SaveImportError extends Error {
  constructor(details: string) {
    super(`Save file is incompatible or corrupted: ${details}`);
    this.name = 'SaveImportError';
  }
}

/**
 * Export a SaveState as a versioned JSON file download.
 */
export function exportToFile(state: SaveState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hex-crawl-save-v${state.version}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse, migrate, and Zod-validate an imported save file.
 * Treats all input as untrusted (OWASP boundary validation).
 */
export async function importFromFile(file: File): Promise<SaveState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          reject(new SaveImportError('Could not read file as text'));
          return;
        }

        let raw: unknown;
        try {
          raw = JSON.parse(text);
        } catch {
          reject(new SaveImportError('File is not valid JSON'));
          return;
        }

        // Migrate then validate
        let migrated: SaveState;
        try {
          migrated = migrate(raw);
        } catch (err) {
          reject(new SaveImportError(err instanceof Error ? err.message : String(err)));
          return;
        }

        const result = SaveStateSchema.safeParse(migrated);
        if (!result.success) {
          const firstError = result.error.issues[0];
          reject(
            new SaveImportError(
              `${firstError.path.join('.')}: ${firstError.message}`,
            ),
          );
          return;
        }

        resolve(result.data as unknown as SaveState);
      } catch (err) {
        reject(new SaveImportError(err instanceof Error ? err.message : String(err)));
      }
    };
    reader.onerror = () => reject(new SaveImportError('File could not be read'));
    reader.readAsText(file);
  });
}
