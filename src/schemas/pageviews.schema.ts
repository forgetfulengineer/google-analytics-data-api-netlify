import { z } from 'zod';

export const createPageviewsQuerySchema = (pagePathRegex?: string) =>
  z.object({
    path: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true; // undefined or empty skip
          if (!pagePathRegex) return true; // no regex env, skip check
          const regex = new RegExp(pagePathRegex);
          return regex.test(val);
        },
        { message: 'path does not match required pattern' },
      ),
  });

/** Backwards-compatible static schema (no regex validation) */
export const PageviewsQuerySchema = createPageviewsQuerySchema();
