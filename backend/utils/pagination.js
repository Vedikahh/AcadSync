const DEFAULT_LIMIT = 10;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 100;

const toInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toSortDirection = (rawDirection) => {
  const normalized = String(rawDirection || '').trim().toLowerCase();
  if (normalized === 'desc' || normalized === '-1') return -1;
  if (normalized === 'asc' || normalized === '1') return 1;
  return 1;
};

const parseSortToken = (token) => {
  const trimmed = String(token || '').trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('-')) {
    return { field: trimmed.slice(1), direction: -1 };
  }

  const [field, direction] = trimmed.split(':');
  return { field, direction: toSortDirection(direction) };
};

const buildSortObject = ({ sortQuery, allowedSortFields = [], defaultSort = { createdAt: -1 } }) => {
  const tokens = String(sortQuery || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!tokens.length) {
    return defaultSort;
  }

  const allowed = new Set(allowedSortFields);
  const sort = {};

  tokens.forEach((token) => {
    const parsed = parseSortToken(token);
    if (!parsed || !parsed.field) return;
    if (allowed.size > 0 && !allowed.has(parsed.field)) return;
    sort[parsed.field] = parsed.direction;
  });

  return Object.keys(sort).length ? sort : defaultSort;
};

const parsePaginationParams = (query = {}, options = {}) => {
  const limit = Math.min(Math.max(toInteger(query.limit, DEFAULT_LIMIT), 1), MAX_LIMIT);
  const offset = Math.max(toInteger(query.offset, DEFAULT_OFFSET), 0);
  const sort = buildSortObject({
    sortQuery: query.sort,
    allowedSortFields: options.allowedSortFields || [],
    defaultSort: options.defaultSort,
  });

  return { limit, offset, sort };
};

const buildPaginationMeta = ({ totalCount, limit, offset, returnedCount }) => ({
  totalCount,
  limit,
  offset,
  returnedCount,
  hasMore: offset + returnedCount < totalCount,
});

module.exports = {
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
  MAX_LIMIT,
  parsePaginationParams,
  buildPaginationMeta,
};
