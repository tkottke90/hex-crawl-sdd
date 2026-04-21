import { z } from 'zod';
import { HexCoordSchema } from './hex.schema';
import { CharacterSchema, DeathRecordSchema } from './character.schema';
import { WorldMapSchema } from './world-map.schema';

// ---------------------------------------------------------------------------
// GameMode
// ---------------------------------------------------------------------------
const GameModeSchema = z.object({
  type: z.enum(['casual', 'roguelike']),
  allowManualSave: z.boolean(),
  autoSaveOnCheckpoint: z.boolean(),
});

// ---------------------------------------------------------------------------
// Enemy models (inline — mirrors data-model without circular dependency)
// ---------------------------------------------------------------------------
const AttributesSchema = z.object({
  str: z.number(), dex: z.number(), con: z.number(),
  int: z.number(), wis: z.number(), cha: z.number(),
});

const StatusEffectSchema = z.object({
  id: z.string(),
  name: z.string(),
  durationType: z.enum(['rounds', 'permanent']),
  remainingRounds: z.number().nullable(),
  modifiers: AttributesSchema.partial(),
  statModifiers: z.object({
    moveRange: z.number().optional(),
    attackBonus: z.number().optional(),
    defenseBonus: z.number().optional(),
  }),
});

const EnemyUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  classId: z.string(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  level: z.number().int().min(1),
  hp: z.number().int(),
  maxHp: z.number().int().positive(),
  attributes: AttributesSchema,
  portrait: z.string(),
  statusEffects: z.array(StatusEffectSchema),
});

const EnemyCampSchema = z.object({
  id: z.string(),
  coord: HexCoordSchema,
  enemies: z.array(EnemyUnitSchema),
  defeated: z.boolean(),
});

// ---------------------------------------------------------------------------
// Town / hire pool
// ---------------------------------------------------------------------------
const HireableHeroSchema = z.object({
  characterTemplate: CharacterSchema.omit({
    id: true, recruitmentSource: true, actedThisPhase: true, deathRecord: true,
  }),
  hireCost: z.number().nonnegative(),
});

const TownSchema = z.object({
  id: z.string(),
  name: z.string(),
  coord: HexCoordSchema,
  hirePool: z.array(HireableHeroSchema),
});

// ---------------------------------------------------------------------------
// Combat encounter
// ---------------------------------------------------------------------------
const CombatPhaseSchema = z.enum(['player', 'enemy', 'resolution']);

const DiceRollSchema = z.object({
  type: z.enum(['attack', 'damage', 'saving-throw', 'initiative']),
  notation: z.string(),
  dice: z.array(z.number().int()),
  modifier: z.number().int(),
  total: z.number().int(),
  isCritical: z.boolean(),
  isFumble: z.boolean(),
});

const CombatLogEntrySchema = z.object({
  round: z.number().int().nonnegative(),
  phase: CombatPhaseSchema,
  actorId: z.string(),
  action: z.enum(['move', 'attack', 'wait', 'use-item']),
  roll: DiceRollSchema.nullable(),
  targetId: z.string().nullable(),
  hpDelta: z.number().int().nullable(),
  narrative: z.string(),
});

const CombatResolutionSchema = z.object({
  outcome: z.enum(['player-victory', 'player-defeat', 'retreat']),
  survivingFriendlyNpcIds: z.array(z.string()),
  recruitmentOffered: z.boolean(),
});

const CombatEncounterSchema = z.object({
  id: z.string(),
  phase: CombatPhaseSchema,
  round: z.number().int().nonnegative(),
  playerUnits: z.array(z.string()),
  enemyUnits: z.array(z.string()),
  friendlyNpcs: z.array(z.string()),
  combatLog: z.array(CombatLogEntrySchema),
  resolution: CombatResolutionSchema.nullable(),
});

// ---------------------------------------------------------------------------
// Meta-progression stub
// ---------------------------------------------------------------------------
const MetaProgressionModuleSchema = z.object({
  schemaVersion: z.literal(1),
});

// ---------------------------------------------------------------------------
// SaveState — root parse entry
// ---------------------------------------------------------------------------
export const SaveStateSchema = z.object({
  version: z.number().int().nonnegative(),
  gameMode: GameModeSchema,
  worldMap: WorldMapSchema,
  party: z.array(CharacterSchema),
  deathHistory: z.array(DeathRecordSchema),
  invalidated: z.boolean(),
  towns: z.array(TownSchema),
  enemyCamps: z.array(EnemyCampSchema),
  activeCombat: CombatEncounterSchema.nullable(),
  currentLocation: HexCoordSchema,
  gold: z.number(),
  timestamp: z.string(),
  metaProgression: MetaProgressionModuleSchema,
});
