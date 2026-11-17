import { type Env, EnvSchema } from '../schemas/envSchema.js';

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const rawEnv = {
    PROPERTYID: Netlify.env.get('PROPERTYID'),
    GOOGLE_APPLICATION_CREDENTIALS_JSON: Netlify.env.get(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON',
    ),
    STARTDATE: Netlify.env.get('STARTDATE'),
    ENDDATE: Netlify.env.get('ENDDATE'),
    PAGEPATH_REGEX: Netlify.env.get('PAGEPATH_REGEX'),
    ALLOWED_ORIGINS: Netlify.env.get('ALLOWED_ORIGINS'),
  };

  cachedEnv = EnvSchema.parse(rawEnv);
  return cachedEnv;
}

export function resetEnv(): void {
  cachedEnv = null;
}
export type { Env };
