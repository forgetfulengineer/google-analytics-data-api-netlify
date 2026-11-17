import { ZodError } from 'zod';
import { getEnv } from '../src/lib/env.js';
import { checkOrigin } from './cors.js';
import { errorResponse, successResponse } from './response.js';

export interface ApiWrapperOptions {
  enableFlag: string;
  handlerFn: (req: Request, context: unknown) => Promise<unknown>;
  extraHeaders?: Record<string, string>;
}

export async function apiWrapper(
  req: Request,
  context: unknown,
  { enableFlag, handlerFn, extraHeaders = {} }: ApiWrapperOptions,
): Promise<Response> {
  let corsOrigin = '*';

  const appendHeaders = (res: Response): Response => {
    for (const [key, value] of Object.entries(extraHeaders)) {
      res.headers.set(key, value);
    }
    return res;
  };

  try {
    const env = getEnv();
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') ?? null;
    const origin = req.headers.get('origin') || '';
    const isOriginAllowed = checkOrigin(origin, allowedOrigins);
    corsOrigin = allowedOrigins ? (isOriginAllowed ? origin : '') : '*';

    if (!isOriginAllowed) {
      return appendHeaders(
        errorResponse(
          403,
          'CORS_FORBIDDEN',
          'Forbidden: origin not allowed.',
          null,
          corsOrigin,
        ),
      );
    }

    if (req.method === 'OPTIONS') {
      return appendHeaders(
        new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': corsOrigin,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Max-Age': '86400',
          },
        }),
      );
    }

    if (req.method !== 'GET') {
      return appendHeaders(
        errorResponse(
          405,
          'METHOD_NOT_ALLOWED',
          'Method Not Allowed.',
          null,
          corsOrigin,
        ),
      );
    }

    const enable =
      (Netlify.env.get(enableFlag) ?? 'true').toLowerCase() === 'true';
    if (!enable) {
      return appendHeaders(
        errorResponse(404, 'NOT_FOUND', 'Not Found.', null, corsOrigin),
      );
    }

    const result = (await handlerFn(req, context)) as Record<
      string,
      unknown
    > | null;
    const data = result && result.data !== undefined ? result.data : result;
    const meta = result && result.meta !== undefined ? result.meta : null;
    const msg =
      result && result.message !== undefined
        ? (result.message as string)
        : 'Query successful';

    return appendHeaders(successResponse(data, msg, meta, corsOrigin));
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const missingKeys = err.issues
        .map((i) => (i.path.length > 0 ? i.path.join('.') : 'unknown'))
        .join(', ');
      console.error(
        `[Config Error] Missing or invalid environment variable(s): ${missingKeys}`,
      );
    } else {
      console.error('API error:', err);
    }

    const appErr = err as Record<string, unknown> | null;
    if (appErr && typeof appErr.statusCode === 'number') {
      const errCode = (appErr.code as string) || 'INTERNAL_SERVER_ERROR';
      const errMsg = (appErr.message as string) || 'Internal Server Error';
      const errErrors = appErr.errors || null;
      return appendHeaders(
        errorResponse(
          appErr.statusCode,
          errCode,
          errMsg,
          errErrors,
          corsOrigin,
        ),
      );
    }

    return appendHeaders(
      errorResponse(
        500,
        'INTERNAL_SERVER_ERROR',
        'Internal Server Error',
        null,
        corsOrigin,
      ),
    );
  }
}
