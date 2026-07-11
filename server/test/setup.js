/** Carga antes de los tests: JWT de prueba y Firestore en memoria. */
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'unit-test-jwt-secret-min-32-characters-long-for-ci!!';
process.env.IECA_USE_MEMORY_DB = 'true';
process.env.RATE_LIMIT_LOGIN_MAX = process.env.RATE_LIMIT_LOGIN_MAX || '1000';
process.env.RATE_LIMIT_FORGOT_MAX = process.env.RATE_LIMIT_FORGOT_MAX || '1000';
process.env.RATE_LIMIT_RESET_MAX = process.env.RATE_LIMIT_RESET_MAX || '1000';
process.env.RATE_LIMIT_REFRESH_MAX = process.env.RATE_LIMIT_REFRESH_MAX || '1000';
process.env.RATE_LIMIT_API_MAX = process.env.RATE_LIMIT_API_MAX || '10000';
