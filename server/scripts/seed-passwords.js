/**
 * Asigna contraseña "123456" a todos los usuarios de Firestore.
 * Ejecutar una vez: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Falta server/firebase-service-account.json');
  process.exit(1);
}

const { db } = require('../src/config/firebase');

const DEFAULT_PASSWORD = '123456';

async function main() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const snap = await db.collection('usuarios').get();

  if (snap.empty) {
    console.log('No hay usuarios en Firestore. Crea la colección "usuarios" primero.');
    process.exit(0);
  }

  const batch = db.batch();
  snap.docs.forEach((doc) => {
    const data = doc.data();
    const updates = { passwordHash: hash };

    if (!data.usuario) {
      const fallback = {
        '1': 'admin',
        '2': 'contable',
        '3': 'lider'
      }[doc.id];
      if (fallback) updates.usuario = fallback;
    }

    batch.update(doc.ref, updates);
    console.log(`  ✓ ${doc.id} (${data.usuario ?? updates.usuario ?? data.nombre ?? 'sin nombre'})`);
  });

  await batch.commit();
  console.log(`\nListo. Contraseña para todos: ${DEFAULT_PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
