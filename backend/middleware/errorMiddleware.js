const { NotFoundError, normalizeError } = require('../utils/errorHandler');
const { logError } = require('../utils/errorLogger');
const logger = require('../utils/logger');

const notFoundMiddleware = (req, res, next) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  next(new NotFoundError('Route not found'));
};

const errorMiddleware = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const normalizedError = normalizeError(error);
  logError({ req, error, normalizedError });

  return res.status(normalizedError.statusCode).json({
    message: normalizedError.expose ? normalizedError.message : 'Internal server error',
    code: normalizedError.code,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  notFoundMiddleware,
  errorMiddleware,
};
