const logger = require('./logger');

const logError = ({ req, error, normalizedError }) => {
  logger.error({
    message: normalizedError?.message || error?.message || 'Unhandled error',
    code: normalizedError?.code || 'INTERNAL_ERROR',
    statusCode: normalizedError?.statusCode || 500,
    route: req?.originalUrl,
    method: req?.method,
    user: req?.user?.id || req?.user?._id || null,
    ip: req?.ip,
    errorName: error?.name,
    stack: error?.stack,
  });
};

module.exports = {
  logger,
  logError,
};
