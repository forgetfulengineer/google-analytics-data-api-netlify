import { z } from 'zod';
import { env } from '../lib/env.js';

export const PageviewsQuerySchema = z.object({
  path: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // undefined or empty skip
        if (!env.PAGEPATH_REGEX) return true; // no regex env, skip check
        const regex = new RegExp(env.PAGEPATH_REGEX);
        return regex.test(val);
      },
      { message: 'path does not match required pattern' },
    ),
});
