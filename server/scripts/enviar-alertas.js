#!/usr/bin/env node
/**
 * Envía resumen operativo por email (pendientes > N h, recordatorio de cierre).
 * Uso: node scripts/enviar-alertas.js [--force]
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const force = process.argv.includes('--force');

async function main() {
  require('../src/config/firebase');
  const { enviarResumenOperativo } = require('../src/utils/alertas-email');

  const result = await enviarResumenOperativo({ force });

  if (result.skipped) {
    console.log(`[alertas] Omitido: ${result.reason} — ${result.message || ''}`);
    process.exit(0);
  }

  console.log('[alertas] Resumen enviado.');
  console.log(`  Destinatarios: ${(result.destinatarios || []).join(', ')}`);
  console.log(`  Canal: ${result.mailResult?.channel}`);
  console.log(`  Pendientes: ${result.resumen?.pendientes?.length ?? 0}`);
  console.log(`  Recordatorio cierre: ${result.resumen?.cierre?.activo ? 'sí' : 'no'}`);
}

main().catch((err) => {
  console.error('[alertas] Error:', err.message || err);
  process.exit(1);
});
