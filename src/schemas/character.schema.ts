import { z } from 'zod';
import { HexCoordSchema } from './hex.schema';

export const DeathRecordSchema = z.object({
  coord: HexCoordSchema,
  turn: z.number().int().nonnegative(),
});

export const CharacterRoleSchema = z.enum(['pc', 'escort', 'adventurer']);
export const CharacterStatusSchema = z.enum(['active', 'dead']);
export const RecruitmentSourceSchema = z.enum(['starting', 'hired', 'encountered']);

const AttributesSchema = z.object({
  str: z.number(),
  dex: z.number(),
  con: z.number(),
  int: z.number(),
  wis: z.number(),
  cha: z.number(),
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

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: CharacterRoleSchema,
  classId: z.string(),
  level: z.number().int().min(1),
  xp: z.number().int().nonnegative(),
  xpToNextLevel: z.number().int().positive(),
  hp: z.number().int(),
  maxHp: z.number().int().positive(),
  attributes: AttributesSchema,
  portrait: z.string(),
  recruitmentSource: RecruitmentSourceSchema,
  status: CharacterStatusSchema,
  statusEffects: z.array(StatusEffectSchema),
  deathRecord: DeathRecordSchema.nullable(),
  actedThisPhase: z.boolean(),
});
