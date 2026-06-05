#!/usr/bin/env node
/**
 * Comprueba que el servidor está listo para producción antes de npm start.
 * Ejecutar: cd server && npm run verify:prod
 */
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const distIndex = path.join(__dirname, '../dist/index.js');
const isProduction = process.env.NODE_ENV === 'production';

const errors = [];
const warnings = [];

if (!fs.existsSync(distIndex)) {
  errors.push('Falta dist/index.js — ejecuta: npm run build');
}

if (!isProduction) {
  warnings.push('NODE_ENV no es "production" (recomendado en servidores reales).');
}

if (isProduction) {
  const { getProductionConfigErrors } = require('../dist/config/env');
  errors.push(...getProductionConfigErrors());
} else {
  const jwt = process.env.JWT_SECRET?.trim();
  if (!jwt || jwt.length < 32) {
    warnings.push('JWT_SECRET ausente o corto — obligatorio antes de producción.');
  }
  if (!process.env.CORS_ORIGINS?.trim()) {
    warnings.push('CORS_ORIGINS no configurado — obligatorio en producción.');
  }
  const hasFirebase =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
    fs.existsSync(path.join(__dirname, '../firebase-service-account.json'));
  if (!hasFirebase) {
    warnings.push('Firebase no configurado (archivo o FIREBASE_SERVICE_ACCOUNT_JSON).');
  }
}

console.log('');
console.log('Verificación pre-producción — IECA API');
console.log('─────────────────────────────────────');

if (warnings.length) {
  console.log('\nAdvertencias:');
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
}

if (errors.length) {
  console.log('\nErrores (bloquean producción):');
  errors.forEach((e) => console.log(`  ✗ ${e.replace(/^\[PRODUCCIÓN\]\s*/, '')}`));
  console.log('\nConsulta docs/DEPLOY.md\n');
  process.exit(1);
}

console.log('\n✓ Configuración lista para producción.\n');
process.exit(0);
