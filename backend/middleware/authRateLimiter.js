const WINDOW_STATE = new Map();

const now = () => Date.now();

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.connection?.remoteAddress || 'unknown';
};

const prune = (windowMs) => {
  const threshold = now() - windowMs * 2;
  for (const [key, value] of WINDOW_STATE.entries()) {
    if (value.updatedAt < threshold) {
      WINDOW_STATE.delete(key);
    }
  }
};

const createAuthRateLimiter = ({ name, windowMs, maxAttempts }) => {
  if (!name || !windowMs || !maxAttempts) {
    throw new Error('Rate limiter requires name, windowMs, and maxAttempts');
  }

  return (req, res, next) => {
    const current = now();
    const ip = getClientIp(req);
    const key = `${name}:${ip}`;

    const existing = WINDOW_STATE.get(key);

    if (!existing || current > existing.resetAt) {
      WINDOW_STATE.set(key, {
        count: 1,
        resetAt: current + windowMs,
        updatedAt: current,
      });
      if (WINDOW_STATE.size > 5000) {
        prune(windowMs);
      }
      return next();
    }

    existing.count += 1;
    existing.updatedAt = current;

    if (existing.count > maxAttempts) {
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
      });
    }

    return next();
  };
};

module.exports = {
  createAuthRateLimiter,
};
