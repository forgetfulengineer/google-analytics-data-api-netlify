const LOCALHOST_ORIGIN = /^https?:\/\/localhost(:\d+)?$/;

export function checkOrigin(
  origin: string,
  allowedOrigins: string[] | null,
): boolean {
  if (!allowedOrigins) return true;
  if (LOCALHOST_ORIGIN.test(origin)) return true;
  return allowedOrigins.includes(origin);
}
