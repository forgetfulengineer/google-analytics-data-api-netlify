import { defineConfig } from 'vitest/config';

export default defineConfig({
  envDir: false,
  test: {
    setupFiles: ['./tests/setup.ts'],
    env: {
      PROPERTYID: '123456',
      GOOGLE_APPLICATION_CREDENTIALS_JSON:
        '{"project_id":"test-project","client_email":"test@example.com"}',
      STARTDATE: '2026-01-01',
      ENDDATE: '2026-01-31',
      PAGEPATH_REGEX: '^/',
      ALLOWED_ORIGINS: '',
      ENABLE_PAGEVIEW: 'true',
      ENABLE_POPULAR: 'true',
    },
  },
});
