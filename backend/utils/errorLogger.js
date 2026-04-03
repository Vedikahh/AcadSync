const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'acadsync-backend' },
  transports: [
    new winston.transports.Console(),
  ],
});

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
