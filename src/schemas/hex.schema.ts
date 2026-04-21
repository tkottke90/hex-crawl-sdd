import { z } from 'zod';

export const HexCoordSchema = z
  .object({
    q: z.number(),
    r: z.number(),
    s: z.number(),
  })
  .refine((c) => c.q + c.r + c.s === 0, {
    message: 'HexCoord invariant violated: q + r + s must equal 0',
  });
