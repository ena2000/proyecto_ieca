/**
 * Variables de entorno obligatorias y configuración de seguridad del servidor.
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const JWT_MIN_LENGTH = 32;

const WEAK_JWT_SECRETS = new Set([
  'ieca-dev-secret',
  'cambia-este-secreto-en-produccion',
  'secret',
  'jwt-secret',
  'your-secret-key',
  '12345678901234567890123456789012'
]);

const isProduction = process.env.NODE_ENV === 'production';
const devResetCodeInResponse = process.env.DEV_RESET_CODE_IN_RESPONSE === 'true';

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    console.error(`\n[FALTA] Variable de entorno obligatoria: ${name}`);
    console.error('        Copia server/.env.example → server/.env y configúrala.\n');
    process.exit(1);
  }
  return String(value).trim();
}

function validateJwtSecret(secret) {
  if (secret.length < JWT_MIN_LENGTH) {
    console.error(`\n[SEGURIDAD] JWT_SECRET debe tener al menos ${JWT_MIN_LENGTH} caracteres.\n`);
    process.exit(1);
  }
  if (WEAK_JWT_SECRETS.has(secret.toLowerCase())) {
    console.error('\n[SEGURIDAD] JWT_SECRET es una clave débil o de ejemplo.');
    console.error('            Genera una clave aleatoria única para tu entorno.\n');
    process.exit(1);
  }
}

function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGINS;
  if (!raw?.trim()) {
    return ['http://localhost:4200', 'http://127.0.0.1:4200'];
  }
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function isLocalOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function getFirebaseServiceAccountPath() {
  return path.join(__dirname, '../../firebase-service-account.json');
}

function hasFirebaseCredentials(env = process.env) {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) return true;
  return fs.existsSync(getFirebaseServiceAccountPath());
}

/**
 * Credenciales Firebase: archivo local (desarrollo/VPS) o JSON en variable (Render, CI).
 * @returns {Record<string, unknown>}
 */
function loadFirebaseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      console.error('\n[ERROR] FIREBASE_SERVICE_ACCOUNT_JSON no es JSON válido.\n');
      process.exit(1);
    }
  }
  return require(getFirebaseServiceAccountPath());
}

/**
 * Devuelve errores de configuración de producción (sin terminar el proceso).
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string[]}
 */
function getProductionConfigErrors(env = process.env) {
  if (env.NODE_ENV !== 'production') return [];

  const errors = [];

  if (env.IECA_USE_MEMORY_DB === 'true') {
    errors.push('[PRODUCCIÓN] IECA_USE_MEMORY_DB=true no está permitido.');
  }

  if (env.DEV_RESET_CODE_IN_RESPONSE === 'true') {
    errors.push('[PRODUCCIÓN] DEV_RESET_CODE_IN_RESPONSE debe estar desactivado.');
  }

  const corsRaw = env.CORS_ORIGINS?.trim();
  if (!corsRaw) {
    errors.push('[PRODUCCIÓN] CORS_ORIGINS es obligatorio (URL(s) del frontend).');
  } else {
    const origins = corsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    if (origins.length === 0) {
      errors.push('[PRODUCCIÓN] CORS_ORIGINS no contiene orígenes válidos.');
    } else if (origins.every(isLocalOrigin)) {
      errors.push('[PRODUCCIÓN] CORS_ORIGINS no puede ser solo localhost en producción.');
    }
  }

  if (!hasFirebaseCredentials(env)) {
    errors.push(
      '[PRODUCCIÓN] Falta Firebase: server/firebase-service-account.json o FIREBASE_SERVICE_ACCOUNT_JSON.'
    );
  }

  return errors;
}

function validateProductionEnvironment() {
  const errors = getProductionConfigErrors();
  if (errors.length === 0) return;

  console.error('\n╔══════════════════════════════════════════════════════════╗');
  console.error('║  Configuración inválida para NODE_ENV=production         ║');
  console.error('╚══════════════════════════════════════════════════════════╝\n');
  for (const err of errors) {
    console.error(`  • ${err}`);
  }
  console.error('\n  Consulta docs/DEPLOY.md y server/.env.example\n');
  process.exit(1);
}

const JWT_SECRET = requireEnv('JWT_SECRET');
validateJwtSecret(JWT_SECRET);
validateProductionEnvironment();

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  JWT_SECRET,
  JWT_MIN_LENGTH,
  CORS_ORIGINS: parseCorsOrigins(),
  isProduction,
  smtpConfigured: Boolean(
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  ),
  devResetCodeInResponse,
  alertasEmailEnabled: process.env.ALERTAS_EMAIL_ENABLED !== 'false',
  alertasCronEnabled: process.env.ALERTAS_CRON_ENABLED === 'true',
  alertasCronIntervalMs: Number(process.env.ALERTAS_CRON_INTERVAL_MS) || 24 * 60 * 60 * 1000,
  getProductionConfigErrors,
  validateProductionEnvironment,
  getFirebaseServiceAccountPath,
  hasFirebaseCredentials,
  loadFirebaseServiceAccount
};
