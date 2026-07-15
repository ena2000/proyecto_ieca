#!/usr/bin/env node
/**
 * Borra las colecciones principales de Firestore y carga datos demo aleatorios.
 *
 * Uso:
 *   npm run seed:random
 *   npm run seed:random -- --seed=42
 *   npm run seed:random -- --save-backup
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { generateRandomBackup } = require('./generate-random-backup');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1]?.trim() : '';
}

function hasFlag(name) {
  return process.argv.includes(name);
}

async function main() {
  const { hasFirebaseCredentials } = require('../src/config/env');
  if (!hasFirebaseCredentials()) {
    console.error('\n[FALTA] Firebase: coloca firebase-service-account.json en server/');
    console.error('        o define FIREBASE_SERVICE_ACCOUNT_JSON en server/.env\n');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && !hasFlag('--force')) {
    console.error('\n[SEGURIDAD] Estás en producción. Usa --force si realmente quieres borrar todo.\n');
    process.exit(1);
  }

  const seedArg = arg('--seed');
  const seed = seedArg ? Number(seedArg) : Date.now();
  if (Number.isNaN(seed)) {
    console.error('El valor de --seed debe ser un número.');
    process.exit(1);
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  IECA — Reset de base + datos demo aleatorios        ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  console.log(`  Semilla: ${seed}`);
  console.log('  Borrando ingresos, gastos, ministerios, usuarios, notificaciones...\n');

  const backup = generateRandomBackup({ seed });
  const { restoreBackup } = require('../src/utils/backup');
  await restoreBackup(backup);
  try {
    const { invalidateBootstrapCache } = require('../src/utils/bootstrapCache');
    invalidateBootstrapCache();
  } catch {
    /* si el API no está cargado en este proceso, no hay caché en memoria que invalidar */
  }

  if (hasFlag('--save-backup')) {
    const outPath = path.join(__dirname, '../../docs/backup-demo-ieca.json');
    const { seed: _s, ...toSave } = backup;
    fs.writeFileSync(outPath, `${JSON.stringify(toSave, null, 2)}\n`, 'utf8');
    console.log(`  Respaldo guardado en ${outPath}\n`);
  }

  console.log('  ✓ Base restaurada con datos aleatorios\n');
  console.log('  Credenciales (contraseña para todos: 123456):\n');
  console.log('  ┌──────────────────┬─────────────────────────────┬─────────────────┐');
  console.log('  │ Usuario          │ Nombre                      │ Rol             │');
  console.log('  ├──────────────────┼─────────────────────────────┼─────────────────┤');

  for (const u of backup.usuarios) {
    const login = String(u.usuario).padEnd(16).slice(0, 16);
    const nombre = String(u.nombre).padEnd(27).slice(0, 27);
    const rol = String(u.rol).padEnd(15).slice(0, 15);
    console.log(`  │ ${login} │ ${nombre} │ ${rol} │`);
  }

  console.log('  └──────────────────┴─────────────────────────────┴─────────────────┘\n');
  console.log(`  Ministerios: ${backup.ministerios.length}`);
  console.log(`  Colaboradores: ${backup.usuarios.filter((u) => u.rol === 'Colaborador').length}`);
  console.log(`  Ingresos: ${backup.ingresos.length} | Gastos: ${backup.gastos.length}\n`);
  console.log('  Inicia sesión con admin / 123456 y recarga el panel.\n');
}

main().catch((err) => {
  console.error('\n[error]', err.message || err);
  process.exit(1);
});
