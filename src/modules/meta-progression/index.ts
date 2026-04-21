import type { MetaProgressionModule } from '../../models/meta-progression';

export type { MetaProgressionModule };

/**
 * Stub implementation of MetaProgressionModule.
 * Provides the extension point for future meta-progression features
 * without requiring architectural change (Constitution Principle IV).
 */
export function createMetaProgressionModule(): MetaProgressionModule {
  return { schemaVersion: 1 };
}
