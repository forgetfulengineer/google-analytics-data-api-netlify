import { EnvSchema } from '../schemas/envSchema.js';

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

export const env = EnvSchema.parse(rawEnv);
