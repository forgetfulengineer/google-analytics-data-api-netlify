import { z } from 'zod';

export const EnvSchema = z.object({
  PROPERTYID: z.string().min(1, 'PROPERTYID is required'),
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z
    .string()
    .min(1, 'GOOGLE_APPLICATION_CREDENTIALS_JSON is required'),
  STARTDATE: z.string().min(1, 'STARTDATE is required'),
  ENDDATE: z.string().min(1, 'ENDDATE is required'),
  PAGEPATH_REGEX: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;
