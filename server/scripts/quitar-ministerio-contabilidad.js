#!/usr/bin/env node
/**
 * Elimina el ministerio "Contabilidad" de Firestore si no tiene colaboradores ni movimientos.
 *
 * Uso:
 *   node server/scripts/quitar-ministerio-contabilidad.js
 *   node server/scripts/quitar-ministerio-contabilidad.js --force
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { listCollection, deleteFromCollection } = require('../src/utils/firestore');
const { esMinisterioExcluidoCatalogo } = require('../src/constants/ministerios-catalogo');

async function main() {
  const force = process.argv.includes('--force');
  const { hasFirebaseCredentials } = require('../src/config/env');
  if (!hasFirebaseCredentials()) {
    console.error('\n[FALTA] Firebase: credenciales en server/\n');
    process.exit(1);
  }

  const ministerios = await listCollection('ministerios');
  const objetivo = ministerios.find(m => esMinisterioExcluidoCatalogo(m.nombre));
  if (!objetivo) {
    console.log('\n✓ No hay ministerio Contabilidad en la base.\n');
    return;
  }

  const id = Number(objetivo.id);
  const [usuarios, ingresos, gastos] = await Promise.all([
    listCollection('usuarios'),
    listCollection('ingresos'),
    listCollection('gastos')
  ]);

  const usuariosVinculados = usuarios.filter(u => Number(u.ministerioId) === id);
  const ingresosVinculados = ingresos.filter(i => Number(i.ministerioId) === id);
  const gastosVinculados = gastos.filter(g => Number(g.ministerioId) === id);

  if (usuariosVinculados.length || ingresosVinculados.length || gastosVinculados.length) {
    console.error('\n[ABORTADO] Contabilidad tiene datos vinculados:');
    console.error(`  Usuarios: ${usuariosVinculados.length}`);
    console.error(`  Ingresos: ${ingresosVinculados.length}`);
    console.error(`  Gastos: ${gastosVinculados.length}`);
    console.error('  Reasigna o elimina esos registros antes de borrar el ministerio.\n');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && !force) {
    console.error('\n[SEGURIDAD] Producción: usa --force para confirmar borrado.\n');
    process.exit(1);
  }

  await deleteFromCollection('ministerios', id);
  console.log(`\n✓ Ministerio Contabilidad (id ${id}) eliminado de Firestore.\n`);
}

main().catch(err => {
  console.error('\n[error]', err.message || err);
  process.exit(1);
});
