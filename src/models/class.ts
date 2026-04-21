import type { Attributes } from './attributes';

export type ClassTier = 'base' | 'promoted';

export interface ClassDefinition {
  id: string;
  name: string;
  tier: ClassTier;
  baseStats: Attributes;
  growthRates: Attributes;
  maxHpBase: number;
  maxHpGrowth: number;
  promotionLevel: number | null;
  promotionPaths: string[];
  moveRange: number;
}
