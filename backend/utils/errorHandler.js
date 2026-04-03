class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', details, expose = false } = {}) {
    super(message || 'Internal server error');
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.expose = expose;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, { statusCode: 400, code: 'VALIDATION_ERROR', details, expose: true });
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details) {
    super(message, { statusCode: 401, code: 'AUTHENTICATION_ERROR', details, expose: true });
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Not authorized', details) {
    super(message, { statusCode: 403, code: 'AUTHORIZATION_ERROR', details, expose: true });
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details) {
    super(message, { statusCode: 404, code: 'NOT_FOUND', details, expose: true });
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict detected', details) {
    super(message, { statusCode: 409, code: 'CONFLICT_ERROR', details, expose: true });
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database unavailable', details) {
    super(message, { statusCode: 503, code: 'DATABASE_ERROR', details, expose: false });
  }
}

const normalizeError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  if (error?.name === 'CastError') {
    return new ValidationError('Invalid identifier provided', {
      path: error.path,
      value: error.value,
    });
  }

  if (error?.name === 'ValidationError') {
    return new ValidationError(error.message, { errors: error.errors });
  }

  if (error?.code === 11000) {
    return new ConflictError('Duplicate value violates a unique constraint', {
      keyValue: error.keyValue,
    });
  }

  if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
    return new AuthenticationError('Invalid or expired authentication token');
  }

  if (error?.name === 'MongoNetworkError' || error?.name === 'MongooseServerSelectionError') {
    return new DatabaseError('Database connection error');
  }

  const message = error?.message && typeof error.message === 'string'
    ? error.message
    : 'Internal server error';

  return new AppError(message, {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    expose: false,
  });
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  normalizeError,
};
