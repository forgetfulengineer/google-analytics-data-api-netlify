export function jsonResponse(
  statusCode: number,
  data: unknown,
  origin: string = '*',
): Response {
  return Response.json(data, {
    status: statusCode,
    headers: {
      'Access-Control-Allow-Origin': origin,
    },
  });
}

export function successResponse(
  data: unknown,
  message: string = 'Query successful',
  meta: unknown = null,
  origin: string = '*',
): Response {
  const payload: Record<string, unknown> = {
    code: 'SUCCESS',
    message,
    data,
  };
  if (meta !== null && meta !== undefined) {
    payload.meta = meta;
  }
  return jsonResponse(200, payload, origin);
}

export function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  errors: unknown = null,
  origin: string = '*',
): Response {
  const payload: Record<string, unknown> = {
    code,
    message,
    data: null,
  };
  if (errors !== null && errors !== undefined) {
    payload.errors = errors;
  }
  return jsonResponse(statusCode, payload, origin);
}
