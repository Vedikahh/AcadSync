const AuditLog = require('../models/AuditLog');

const toComparableValue = (value) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value ?? null;
};

const createDiffSummary = (before = {}, after = {}, fields = []) => {
  const uniqueFields = Array.from(new Set(fields));

  return uniqueFields.reduce((acc, field) => {
    const previousValue = toComparableValue(before[field]);
    const nextValue = toComparableValue(after[field]);

    if (previousValue !== nextValue) {
      acc.push({
        field,
        from: before[field] ?? null,
        to: after[field] ?? null,
      });
    }

    return acc;
  }, []);
};

const getClientIp = (req) => {
  if (!req) return '';

  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || '';
};

const writeAuditLog = async (req, payload = {}) => {
  try {
    if (!payload?.action || !payload?.target?.entityType || !payload?.target?.entityId) {
      return;
    }

    const actorId = req?.user?.id || req?.user?._id;
    const actorRole = req?.user?.role;
    if (!actorId || !actorRole) {
      return;
    }

    await AuditLog.create({
      actor: {
        id: actorId,
        role: actorRole,
      },
      action: payload.action,
      target: {
        entityType: payload.target.entityType,
        entityId: String(payload.target.entityId),
        label: payload.target.label || '',
      },
      metadata: payload.metadata || {},
      diffSummary: Array.isArray(payload.diffSummary) ? payload.diffSummary : [],
      source: {
        ip: getClientIp(req),
        userAgent: req?.headers?.['user-agent'] || '',
      },
    });
  } catch (err) {
    // Logging failures must never block primary workflows.
    console.error('[AuditLog] Failed to write audit log:', err.message);
  }
};

module.exports = {
  writeAuditLog,
  createDiffSummary,
};