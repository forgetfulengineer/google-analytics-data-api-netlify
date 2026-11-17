export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  errors: { field: string; reason: string }[];

  constructor(errors: { field: string; reason: string }[]) {
    super('Validation failed', 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(msg = 'Not found') {
    super(msg, 404, 'NOT_FOUND');
  }
}

export class UpstreamError extends AppError {
  constructor(msg = 'Upstream service error') {
    super(msg, 503, 'UPSTREAM_ERROR');
  }
}
