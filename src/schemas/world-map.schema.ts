import { z } from 'zod';
import { HexCoordSchema } from './hex.schema';

const TerrainTypeSchema = z.enum([
  'ocean', 'beach', 'grassland', 'forest', 'desert', 'mountain', 'snow',
]);
const PoiTagSchema = z.enum([
  'empty', 'town', 'enemy-camp', 'recruitment-event', 'dungeon-entrance',
]);

const HexTileSchema = z.object({
  coord: HexCoordSchema,
  terrain: TerrainTypeSchema,
  passable: z.boolean(),
  moveCost: z.number().positive(),
  poiTag: PoiTagSchema,
  occupants: z.array(z.string()),
  fogOfWar: z.boolean(),
  explored: z.boolean(),
});

export const WorldMapSchema = z.object({
  seed: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  tiles: z.record(z.string(), HexTileSchema),
  towns: z.array(z.string()),
  enemyCamps: z.array(z.string()),
  playerStartCoord: HexCoordSchema,
  remainingTurnBudget: z.number().int().nonnegative().optional(),
});
