// Mock Netlify global object in test environment
globalThis.Netlify = {
  env: {
    get: (key: string) => process.env[key],
  },
} as unknown as typeof Netlify;
