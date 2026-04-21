import type { ClassDefinition } from '../models/class';

// ---------------------------------------------------------------------------
// Base classes (tier: 'base', promotionLevel: 10, promotionPaths: 2+ IDs)
// growthRates are probabilities 0.0–1.0 (Fire Emblem style)
// ---------------------------------------------------------------------------
export const BASE_CLASSES: ClassDefinition[] = [
  {
    id: 'fighter',
    name: 'Fighter',
    tier: 'base',
    baseStats: { str: 12, dex: 10, con: 12, int: 8, wis: 8, cha: 8 },
    growthRates: { str: 0.65, dex: 0.40, con: 0.55, int: 0.20, wis: 0.20, cha: 0.20 },
    maxHpBase: 12,
    maxHpGrowth: 0.50,
    promotionLevel: 10,
    promotionPaths: ['knight', 'berserker'],
    moveRange: 3,
  },
  {
    id: 'rogue',
    name: 'Rogue',
    tier: 'base',
    baseStats: { str: 10, dex: 14, con: 8, int: 10, wis: 10, cha: 12 },
    growthRates: { str: 0.35, dex: 0.70, con: 0.30, int: 0.30, wis: 0.30, cha: 0.40 },
    maxHpBase: 8,
    maxHpGrowth: 0.35,
    promotionLevel: 10,
    promotionPaths: ['assassin', 'trickster'],
    moveRange: 4,
  },
  {
    id: 'mage',
    name: 'Mage',
    tier: 'base',
    baseStats: { str: 7, dex: 10, con: 8, int: 15, wis: 13, cha: 10 },
    growthRates: { str: 0.15, dex: 0.30, con: 0.25, int: 0.70, wis: 0.55, cha: 0.30 },
    maxHpBase: 6,
    maxHpGrowth: 0.25,
    promotionLevel: 10,
    promotionPaths: ['sorcerer', 'sage'],
    moveRange: 3,
  },
  {
    id: 'cleric',
    name: 'Cleric',
    tier: 'base',
    baseStats: { str: 9, dex: 9, con: 11, int: 11, wis: 15, cha: 14 },
    growthRates: { str: 0.25, dex: 0.25, con: 0.45, int: 0.40, wis: 0.65, cha: 0.50 },
    maxHpBase: 8,
    maxHpGrowth: 0.40,
    promotionLevel: 10,
    promotionPaths: ['bishop', 'paladin'],
    moveRange: 3,
  },
];

// ---------------------------------------------------------------------------
// Promoted classes (tier: 'promoted', promotionPaths: [])
// ---------------------------------------------------------------------------
export const PROMOTED_CLASSES: ClassDefinition[] = [
  {
    id: 'knight',
    name: 'Knight',
    tier: 'promoted',
    baseStats: { str: 16, dex: 10, con: 16, int: 8, wis: 8, cha: 8 },
    growthRates: { str: 0.60, dex: 0.30, con: 0.65, int: 0.15, wis: 0.15, cha: 0.15 },
    maxHpBase: 18,
    maxHpGrowth: 0.60,
    promotionLevel: null,
    promotionPaths: [],
    moveRange: 3,
  },
  {
    id: 'berserker',
    name: 'Berserker',
    tier: 'promoted',
    baseStats: { str: 20, dex: 12, con: 14, int: 6, wis: 6, cha: 6 },
    growthRates: { str: 0.80, dex: 0.45, con: 0.55, int: 0.10, wis: 0.10, cha: 0.10 },
    maxHpBase: 16,
    maxHpGrowth: 0.55,
    promotionLevel: null,
    promotionPaths: [],
    moveRange: 4,
  },
  {
    id: 'assassin',
    name: 'Assassin',
    tier: 'promoted',
    baseStats: { str: 12, dex: 20, con: 10, int: 12, wis: 10, cha: 14 },
    growthRates: { str: 0.30, dex: 0.80, con: 0.25, int: 0.30, wis: 0.25, cha: 0.40 },
    maxHpBase: 12,
    maxHpGrowth: 0.40,
    promotionLevel: null,
    promotionPaths: [],
    moveRange: 5,
  },
  {
    id: 'trickster',
    name: 'Trickster',
    tier: 'promoted',
    baseStats: { str: 10, dex: 18, con: 10, int: 14, wis: 12, cha: 18 },
    growthRates: { str: 0.25, dex: 0.70, con: 0.30, int: 0.45, wis: 0.35, cha: 0.60 },
    maxHpBase: 10,
    maxHpGrowth: 0.35,
    promotionLevel: null,
    promotionPaths: [],
    moveRange: 5,
  },
  {
    id: 'sorcerer',
    name: 'Sorcerer',
    tier: 'promoted',
    baseStats: { str: 7, dex: 12, con: 10, int: 20, wis: 14, cha: 12 },
    growthRates: { str: 0.10, dex: 0.25, con: 0.30, int: 0.80, wis: 0.55, cha: 0.35 },
    maxHpBase: 8,
    maxHpGrowth: 0.30,
    promotionLevel: null,
    promotionPaths: [],
    moveRange: 3,
  },
  {
    id: 'sage',
    name: 'Sage',
    tier: 'promoted',
    baseStats: { str: 8, dex: 10, con: 10, int: 18, wis: 18, cha: 12 },
    growthRates: { str: 0.15, dex: 0.25, con: 0.35, int: 0.70, wis: 0.70, cha: 0.35 },
    maxHpBase: 8,
    maxHpGrowth: 0.30,
    promotionLevel: null,
    promotionPaths: [],
    moveRange: 3,
  },
  {
    id: 'bishop',
    name: 'Bishop',
    tier: 'promoted',
    baseStats: { str: 10, dex: 10, con: 12, int: 14, wis: 20, cha: 16 },
    growthRates: { str: 0.20, dex: 0.20, con: 0.45, int: 0.50, wis: 0.75, cha: 0.55 },
    maxHpBase: 10,
    maxHpGrowth: 0.40,
    promotionLevel: null,
    promotionPaths: [],
    moveRange: 3,
  },
  {
    id: 'paladin',
    name: 'Paladin',
    tier: 'promoted',
    baseStats: { str: 14, dex: 10, con: 14, int: 10, wis: 18, cha: 16 },
    growthRates: { str: 0.45, dex: 0.25, con: 0.55, int: 0.25, wis: 0.65, cha: 0.50 },
    maxHpBase: 14,
    maxHpGrowth: 0.50,
    promotionLevel: null,
    promotionPaths: [],
    moveRange: 4,
  },
];

export const ALL_CLASSES: ClassDefinition[] = [...BASE_CLASSES, ...PROMOTED_CLASSES];

export function getClassById(id: string): ClassDefinition | undefined {
  return ALL_CLASSES.find((c) => c.id === id);
}
