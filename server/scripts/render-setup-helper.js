#!/usr/bin/env node
/**
 * Ayuda a preparar variables para Render (Web Service IECA API).
 * Uso: node scripts/render-setup-helper.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const serverRoot = path.join(__dirname, '..');
const firebaseFile = path.join(serverRoot, 'firebase-service-account.json');

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  IECA — Checklist de variables para Render');
console.log('═══════════════════════════════════════════════════════');
console.log('');

const checks = [];

if (fs.existsSync(path.join(serverRoot, 'dist/index.js'))) {
  checks.push(['✓', 'dist/index.js existe (npm run build OK)']);
} else {
  checks.push(['✗', 'Ejecuta: cd server && npm run build']);
}

if (fs.existsSync(path.join(serverRoot, 'assets/email/logo_ieca2_email.png'))) {
  checks.push(['✓', 'Logo de correo optimizado generado']);
} else {
  checks.push(['⚠', 'Logo email: se genera en npm run build']);
}

if (process.env.JWT_SECRET?.trim()?.length >= 32) {
  checks.push(['✓', 'JWT_SECRET local configurado (≥ 32 chars)']);
} else {
  checks.push(['⚠', 'Genera JWT_SECRET (ver abajo)']);
}

if (firebaseFile) {
  if (fs.existsSync(firebaseFile)) {
    checks.push(['✓', 'firebase-service-account.json encontrado']);
  } else {
    checks.push(['✗', 'Coloca firebase-service-account.json en server/']);
  }
}

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  checks.push(['✓', 'SMTP configurado en server/.env']);
} else {
  checks.push(['⚠', 'SMTP recomendado para recuperación de contraseña y alertas']);
}

for (const [icon, msg] of checks) {
  console.log(`  ${icon}  ${msg}`);
}

console.log('');
console.log('── Variables en Render → Environment ──');
console.log('');
console.log('Obligatorias:');
console.log('  NODE_ENV=production');
console.log('  JWT_SECRET=<secreto único ≥ 32 caracteres>');
console.log('  CORS_ORIGINS=https://TU-PROYECTO.web.app');
console.log('       (URL HTTPS exacta del frontend en Firebase Hosting)');
console.log('  FIREBASE_SERVICE_ACCOUNT_JSON=<JSON en una sola línea>');
console.log('');
console.log('Correo (recomendado — mismos valores que server/.env):');
console.log('  SMTP_HOST=smtp.gmail.com');
console.log('  SMTP_PORT=587');
console.log('  SMTP_SECURE=false');
console.log('  SMTP_USER=...');
console.log('  SMTP_PASS=...');
console.log('  SMTP_FROM=IECA Finanzas <tu-correo@gmail.com>');
console.log('');
console.log('Alertas (opcional):');
console.log('  ALERTAS_EMAIL_ENABLED=true');
console.log('  ALERTAS_CRON_ENABLED=true');
console.log('');

const jwt = crypto.randomBytes(48).toString('hex');
console.log('── JWT_SECRET sugerido (cópialo en Render) ──');
console.log(jwt);
console.log('');

if (fs.existsSync(firebaseFile)) {
  try {
    const json = JSON.parse(fs.readFileSync(firebaseFile, 'utf8'));
    const oneLine = JSON.stringify(json);
    const outFile = path.join(serverRoot, 'render-firebase-oneline.txt');
    fs.writeFileSync(outFile, oneLine, 'utf8');
    console.log('── FIREBASE_SERVICE_ACCOUNT_JSON ──');
    console.log(`  Guardado en: server/render-firebase-oneline.txt`);
    console.log('  Copia TODO el contenido de ese archivo en Render.');
    console.log('  (No subas ese archivo a Git — ya está en .gitignore)');
  } catch (err) {
    console.log('  ✗ No se pudo leer Firebase JSON:', err.message);
  }
} else {
  console.log('── FIREBASE_SERVICE_ACCOUNT_JSON ──');
  console.log('  PowerShell:');
  console.log('  Get-Content server\\firebase-service-account.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress');
}

console.log('');
console.log('── Despliegue ──');
console.log('  1. Sube los cambios a GitHub (main)');
console.log('  2. Render → New → Blueprint → repo proyecto_ieca');
console.log('  3. Completa CORS_ORIGINS y FIREBASE_SERVICE_ACCOUNT_JSON');
console.log('  4. Tras el deploy: https://ieca-api.onrender.com/api/health');
console.log('  5. Actualiza src/environments/environment.prod.ts con la URL del API');
console.log('  6. Firebase Hosting: npm run build:ci && firebase deploy --only hosting');
console.log('');
console.log('  Guía: docs/DEPLOY.md');
console.log('');
