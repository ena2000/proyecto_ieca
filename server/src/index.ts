require('dotenv').config();

const { PORT, isProduction } = require('./config/env');
const { CORS_ORIGINS } = require('./middleware/cors');
const { createApp } = require('./createApp');

const app = createApp();
const startedAt = Date.now();

const server = app.listen(PORT, () => {
  const mode = isProduction ? 'PRODUCCIÓN' : 'desarrollo';
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log(`║  IECA API — ${mode.padEnd(28)} ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  API        → http://localhost:${PORT}/api`);
  console.log(`  Health     → http://localhost:${PORT}/api/health`);
  console.log(`  CORS       → ${CORS_ORIGINS.join(', ')}`);
  if (isProduction) {
    console.log('  Seguridad  → errores 500 ocultos, JWT refresh activo');
  }
  const { smtpConfigured, brevoConfigured } = require('./config/env');
  let correoLabel = 'sin correo (códigos en consola/pantalla en dev)';
  if (brevoConfigured) {
    correoLabel = 'Brevo API (HTTP)';
  } else if (smtpConfigured) {
    correoLabel = `SMTP ${process.env.SMTP_HOST || 'ok'} (${process.env.SMTP_USER || 'usuario'})`;
  }
  console.log(`  Correo     → ${correoLabel}`);
  if (isProduction && smtpConfigured && !brevoConfigured) {
    console.log('  Aviso      → En Render Free usa BREVO_API_KEY; SMTP suele estar bloqueado.');
  }

  const { alertasCronEnabled, alertasCronIntervalMs, alertasEmailEnabled } = require('./config/env');
  if (
    alertasCronEnabled &&
    alertasEmailEnabled &&
    process.env.IECA_USE_MEMORY_DB !== 'true'
  ) {
    const { enviarResumenOperativo } = require('./utils/alertas-email');
    const ejecutar = () => {
      enviarResumenOperativo()
        .then((r) => {
          if (!r.skipped) {
            console.log('[alertas-cron] Resumen enviado.');
          }
        })
        .catch((err) => console.error('[alertas-cron]', err.message || err));
    };
    setTimeout(ejecutar, 60_000);
    setInterval(ejecutar, alertasCronIntervalMs);
    console.log(`  Alertas    → cron cada ${Math.round(alertasCronIntervalMs / 3600000)} h`);
  }
  console.log('');
});

function shutdown(signal) {
  console.log(`\n[shutdown] Señal ${signal} — cerrando servidor…`);
  server.close((err) => {
    if (err) {
      console.error('[shutdown] Error al cerrar:', err.message);
      process.exit(1);
    }
    console.log('[shutdown] Servidor detenido correctamente.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[shutdown] Timeout — forzando salida.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, server, startedAt };
