const { db } = require('../config/firebase');
const { listCollection } = require('./firestore');
const { ROLES } = require('../middleware/auth');
const { smtpConfigured, isProduction } = require('../config/env');
const { sendOperationalDigestEmail } = require('./email');
const {
  construirResumenOperativo,
  HORAS_PENDIENTE_DEFAULT,
  DIAS_RECORDATORIO_CIERRE_DEFAULT
} = require('./resumen-operativo');

const CONFIG_DOC = 'sistema';

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function alertasConfigFromEnv() {
  return {
    horasPendiente: parsePositiveInt(
      process.env.ALERTAS_HORAS_PENDIENTE,
      HORAS_PENDIENTE_DEFAULT
    ),
    diasRecordatorioCierre: parsePositiveInt(
      process.env.ALERTAS_DIAS_CIERRE,
      DIAS_RECORDATORIO_CIERRE_DEFAULT
    ),
    enabled: process.env.ALERTAS_EMAIL_ENABLED !== 'false'
  };
}

async function readAlertasMeta() {
  const doc = await db.collection('config').doc(CONFIG_DOC).get();
  const data = doc.exists ? doc.data() : {};
  return data.alertasEmail || {};
}

async function marcarResumenEnviado(clave) {
  await db.collection('config').doc(CONFIG_DOC).set(
    {
      alertasEmail: {
        ultimoEnvioEn: new Date().toISOString(),
        ultimoEnvioClave: clave
      }
    },
    { merge: true }
  );
}

function claveEnvioDiario(fecha = new Date()) {
  return fecha.toISOString().slice(0, 10);
}

async function yaSeEnvioHoy() {
  const meta = await readAlertasMeta();
  return meta.ultimoEnvioClave === claveEnvioDiario();
}

async function obtenerDestinatariosOperativos() {
  const usuarios = await listCollection('usuarios');
  const roles = new Set([ROLES.ADMIN, ROLES.CONTABLE]);
  const emails = usuarios
    .filter((u) => roles.has(u.rol) && String(u.estado || 'Activo') === 'Activo')
    .map((u) => String(u.email || '').trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(emails)];
}

/**
 * @param {{ force?: boolean }} [options]
 */
async function enviarResumenOperativo(options: { force?: boolean } = {}) {
  const cfg = alertasConfigFromEnv();

  if (!cfg.enabled) {
    return {
      skipped: true,
      reason: 'disabled',
      message: 'Alertas por email desactivadas (ALERTAS_EMAIL_ENABLED=false).'
    };
  }

  const resumen = await construirResumenOperativo({
    horasPendiente: cfg.horasPendiente,
    diasRecordatorioCierre: cfg.diasRecordatorioCierre
  });

  if (!resumen.tieneContenido) {
    return {
      skipped: true,
      reason: 'no_content',
      resumen,
      message: 'No hay pendientes antiguos ni recordatorio de cierre.'
    };
  }

  if (!options.force && (await yaSeEnvioHoy())) {
    return {
      skipped: true,
      reason: 'already_sent_today',
      resumen,
      message: 'Ya se envió un resumen hoy.'
    };
  }

  const destinatarios = await obtenerDestinatariosOperativos();
  if (!destinatarios.length) {
    return {
      skipped: true,
      reason: 'no_recipients',
      resumen,
      message: 'No hay administradores/contables con email configurado.'
    };
  }

  const mailResult = await sendOperationalDigestEmail({
    to: destinatarios,
    resumen
  });

  if (mailResult.sent || mailResult.channel === 'console') {
    await marcarResumenEnviado(claveEnvioDiario());
  }

  return {
    skipped: false,
    resumen,
    mailResult,
    destinatarios,
    smtpConfigured,
    isProduction
  };
}

module.exports = {
  alertasConfigFromEnv,
  obtenerDestinatariosOperativos,
  enviarResumenOperativo,
  yaSeEnvioHoy,
  claveEnvioDiario
};
