import type { SaveState } from '../../models/save';
import { CURRENT_SCHEMA_VERSION } from './Serialiser';

export class SaveVersionError extends Error {
  constructor(rawVersion: number, targetVersion: number) {
    super(
      `Save schema version ${rawVersion} is newer than supported version ${targetVersion}. ` +
        'Please update the game to open this save file.',
    );
    this.name = 'SaveVersionError';
  }
}

type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

/** Migration registry: index = fromVersion, value = fn to produce fromVersion+1 data */
const migrations: MigrationFn[] = [
  // v0 → v1: stamp version field
  (data) => ({ ...data, version: 1 }),
];

/**
 * Migrate raw imported data to the target schema version.
 * - Missing/null schemaVersion is treated as version 0.
 * - rawVersion > targetVersion throws SaveVersionError.
 */
export function migrate(raw: unknown, targetVersion = CURRENT_SCHEMA_VERSION): SaveState {
  const data = raw as Record<string, unknown>;
  const rawVersion: number =
    data.schemaVersion == null || typeof data.schemaVersion !== 'number' ? 0 : data.schemaVersion;

  if (rawVersion > targetVersion) {
    throw new SaveVersionError(rawVersion, targetVersion);
  }

  let current = { ...data };
  for (let v = rawVersion; v < targetVersion; v++) {
    const fn = migrations[v];
    if (fn) current = fn(current);
  }

  // Ensure version field is set
  if (typeof current.version !== 'number') {
    current.version = targetVersion;
  }

  return current as unknown as SaveState;
}
