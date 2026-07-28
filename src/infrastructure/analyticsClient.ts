import { BetaAnalyticsDataClient } from '@google-analytics/data';

let _client: BetaAnalyticsDataClient | undefined;

export function getAnalyticsClient(): BetaAnalyticsDataClient {
  if (_client) return _client;

  const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credJson) {
    throw new Error(
      'Missing environment variable: GOOGLE_APPLICATION_CREDENTIALS_JSON',
    );
  }

  try {
    const creds = JSON.parse(credJson);
    _client = new BetaAnalyticsDataClient({ credentials: creds });
    return _client;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON: ${msg}`);
  }
}
