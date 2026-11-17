import { z } from 'zod';
import { getEnv } from '../lib/env.js';

export const PageviewsQuerySchema = z.object({
  path: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // undefined or empty skip
        const pagePathRegex = getEnv().PAGEPATH_REGEX;
        if (!pagePathRegex) return true; // no regex env, skip check
        const regex = new RegExp(pagePathRegex);
        return regex.test(val);
      },
      { message: 'path does not match required pattern' },
    ),
});
