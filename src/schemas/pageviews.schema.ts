import { z } from 'zod';

export const PageviewsQuerySchema = z.object({
  path: z.string().optional(),
});
