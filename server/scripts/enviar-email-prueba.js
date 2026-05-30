#!/usr/bin/env node
/**
 * Envía un correo de prueba a una dirección (no usa la lista admin/contable).
 * Uso: node scripts/enviar-email-prueba.js correo@ejemplo.com
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { smtpConfigured } = require('../src/config/env');
const { sendOperationalDigestEmail } = require('../src/utils/email');
const { buildTestEmail } = require('../src/utils/email-templates');

const to = process.argv[2]?.trim();

async function main() {
  if (!to || !to.includes('@')) {
    console.error('Uso: node scripts/enviar-email-prueba.js correo@ejemplo.com');
    process.exit(1);
  }

  const { subject, text, html } = buildTestEmail();
  const result = await sendOperationalDigestEmail({ to, subject, text, html });

  if (result.channel === 'email') {
    console.log(`[ok] Correo enviado a ${to}`);
  } else if (result.channel === 'console') {
    console.log(`[dev] Sin SMTP: el mensaje se mostró en consola (no llegó a ${to}).`);
    console.log('Configura SMTP_HOST, SMTP_USER y SMTP_PASS en server/.env');
  } else {
    console.log('[error] No se pudo enviar:', result);
    process.exit(1);
  }

  console.log(`  SMTP configurado: ${smtpConfigured ? 'sí' : 'no'}`);
}

main().catch((err) => {
  console.error('[error]', err.message || err);
  process.exit(1);
});
