const LOCAL_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const REQUIRED_ENV_VARS = ['MONGO_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID'];

const isNonEmpty = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const parseCsv = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const isProduction = () => process.env.NODE_ENV === 'production';

const getConfiguredOrigins = () =>
  parseCsv(
    [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN,
      process.env.ALLOWED_ORIGINS,
    ]
      .filter(Boolean)
      .join(',')
  );

const getAllowedOrigins = () => {
  const configured = getConfiguredOrigins();

  if (configured.length > 0) {
    return configured;
  }

  if (!isProduction()) {
    return LOCAL_DEV_ORIGINS;
  }

  return [];
};

const getMissingRequiredVars = () =>
  REQUIRED_ENV_VARS.filter((key) => !isNonEmpty(process.env[key]));

const validateEnvironment = () => {
  const missing = getMissingRequiredVars();

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

};

module.exports = {
  validateEnvironment,
  getAllowedOrigins,
  isProduction,
};
