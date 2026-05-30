#!/usr/bin/env node
/**
 * Crea o actualiza el usuario administrador inicial en Firestore.
 * Uso: node scripts/crear-usuario-inicial.js --email correo@ejemplo.com [--usuario admin]
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1]?.trim() : '';
}

const email = arg('--email');
const login = arg('--usuario') || 'admin';

const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Falta server/firebase-service-account.json');
  process.exit(1);
}

const { db } = require('../src/config/firebase');

async function main() {
  if (!email || !email.includes('@')) {
    console.error('Uso: node scripts/crear-usuario-inicial.js --email correo@ejemplo.com [--usuario admin]');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash('123456', 10);
  const data = {
    usuario: login,
    nombre: 'Administrador',
    email,
    rol: 'Administrador',
    estado: 'Activo',
    passwordHash
  };

  await db.collection('usuarios').doc('1').set(data, { merge: true });
  console.log(`[ok] Usuario "${login}" (id: 1) con email ${email}`);
  console.log('  Contraseña temporal: 123456 (cámbiala tras el primer acceso)');
}

main().catch((err) => {
  console.error('[error]', err.message || err);
  process.exit(1);
});
