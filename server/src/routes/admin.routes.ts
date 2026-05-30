const express = require('express');
const { validate } = require('../middleware/validate');
const { cierreSchema, auditoriaQuerySchema, restoreSchema } = require('../schemas/admin.schema');
const { ROLES } = require('../middleware/auth');
const { buildBackup, restoreBackup } = require('../utils/backup');
const {
  getMesActualLabel,
  getMesActualKey,
  labelToPeriodoKey,
  fechaToPeriodoKey,
  etiquetaParaMes,
  getPeriodosCerrados,
  getUltimoCierreLabel
} = require('../utils/cierre');
const { ejecutarCierreMensual } = require('../utils/cierre-mensual');
const { construirResumenOperativo } = require('../utils/resumen-operativo');
const { enviarResumenOperativo } = require('../utils/alertas-email');
const { asyncHandler } = require('../middleware/errorHandler');
const { listCollection } = require('../utils/firestore');
const { db } = require('../config/firebase');

const router = express.Router();

function csvEscape(value) {
  if (value == null) return '';
  const s = String(value);
  // RFC4180-ish
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows, headers) {
  const lines = [];
  lines.push(headers.map(csvEscape).join(','));
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return lines.join('\r\n');
}

function parseIsoDate(input) {
  if (!input) return null;
  const d = new Date(String(input));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function inRange(iso, desde, hasta) {
  if (!iso) return true;
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return true;
  if (desde && d < desde) return false;
  if (hasta && d > hasta) return false;
  return true;
}

const COLLECTIONS_RESET = [
  'ingresos',
  'gastos',
  'ministerios',
  'usuarios',
  'notificaciones'
];

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

/** GET /api/admin/config — estado del sistema (último cierre, etc.). */
router.get('/config', async (_req, res) => {
  try {
    const [ultimoCierre, periodosCerrados] = await Promise.all([
      getUltimoCierreLabel(),
      getPeriodosCerrados()
    ]);
    const mesActualKey = getMesActualKey();
    res.json({
      ultimoCierre: ultimoCierre ?? null,
      periodosCerrados,
      periodoActual: getMesActualLabel(),
      mesActualCerrado: periodosCerrados.includes(mesActualKey)
    });
  } catch (err) {
    console.error('[admin GET config]', err);
    res.status(500).json({ message: 'Error al leer configuración' });
  }
});

/** GET /api/admin/alertas/resumen — vista previa del resumen operativo (email). */
router.get('/alertas/resumen', asyncHandler(async (_req, res) => {
  const resumen = await construirResumenOperativo();
  res.json(resumen);
}));

/** POST /api/admin/alertas/enviar — envía resumen por email a admin/contable. */
router.post('/alertas/enviar', asyncHandler(async (req, res) => {
  const force = req.body?.force === true;
  const result = await enviarResumenOperativo({ force });
  res.json(result);
}));

/** GET /api/admin/backup — exportar respaldo completo (solo admin). */
router.get('/backup', async (_req, res) => {
  try {
    const backup = await buildBackup();
    res.json(backup);
  } catch (err) {
    console.error('[admin GET backup]', err);
    res.status(500).json({ message: 'Error al generar el respaldo' });
  }
});

/** POST /api/admin/restore — restaurar desde JSON de respaldo (solo admin). */
router.post('/restore', validate(restoreSchema), async (req, res) => {
  try {
    const snapshot = await restoreBackup(req.body);
    res.json({
      message: 'Respaldo restaurado correctamente',
      backup: snapshot
    });
  } catch (err) {
    console.error('[admin POST restore]', err);
    const status = err.message?.includes('inválido') ? 400 : 500;
    res.status(status).json({
      message: err.message || 'Error al restaurar el respaldo'
    });
  }
});

/** POST /api/admin/cierre — registrar cierre del mes indicado (por defecto mes actual). */
router.post('/cierre', validate(cierreSchema), asyncHandler(async (req, res) => {
  const periodoLabel = String(req.body?.periodo ?? getMesActualLabel()).trim();
  const periodoKey = labelToPeriodoKey(periodoLabel) || getMesActualKey();
  const result = await ejecutarCierreMensual(periodoKey);
  res.json(result);
}));

/** DELETE /api/admin/datos — vaciar colecciones principales (solo admin). */
router.delete('/datos', async (_req, res) => {
  try {
    for (const name of COLLECTIONS_RESET) {
      await clearCollection(name);
    }
    await db.collection('config').doc('sistema').set(
      { ultimoCierre: null, periodosCerrados: [] },
      { merge: true }
    );
    res.json({ message: 'Datos eliminados correctamente' });
  } catch (err) {
    console.error('[admin DELETE datos]', err);
    res.status(500).json({ message: 'Error al eliminar los datos' });
  }
});

/** GET /api/admin/login-auditoria — intentos de login fallidos recientes. */
router.get('/login-auditoria', async (req, res) => {
  try {
    const { listFailedLoginAttempts } = require('../utils/loginAudit');
    const limit = Math.min(Number(req.query?.limit) || 50, 200);
    const intentos = await listFailedLoginAttempts(limit);
    res.json(intentos);
  } catch (err) {
    console.error('[admin GET login-auditoria]', err);
    res.status(500).json({ message: 'Error al leer auditoría de login' });
  }
});

/** GET /api/admin/auditoria — descargar CSV de auditoría (solo admin). */
router.get('/auditoria', validate(auditoriaQuerySchema, 'query'), async (req, res) => {
  try {
    const { tipo, desde: desdeStr, hasta: hastaStr } = req.query;
    const desde = parseIsoDate(desdeStr);
    const hasta = parseIsoDate(hastaStr);

    const includeIngresos = tipo === 'todos' || tipo === 'ingresos';
    const includeGastos = tipo === 'todos' || tipo === 'gastos';

    const rows = [];

    if (includeIngresos) {
      const ingresos = await listCollection('ingresos');
      for (const i of ingresos) {
        if (!inRange(i.fecha, desde, hasta)) continue;
        rows.push({
          tipo: 'ingreso',
          id: i.id,
          fecha: i.fecha,
          fechaFormateada: i.fechaFormateada,
          ministerio: i.ministerio,
          ministerioId: i.ministerioId,
          descripcion: i.descripcion,
          monto: i.monto,
          estado: i.estado,
          auditCreadoPorId: i.auditCreadoPorId,
          auditCreadoPorNombre: i.auditCreadoPorNombre,
          auditCreadoEn: i.auditCreadoEn,
          auditActualizadoPorId: i.auditActualizadoPorId,
          auditActualizadoPorNombre: i.auditActualizadoPorNombre,
          auditActualizadoEn: i.auditActualizadoEn,
          aprobadoPor: i.aprobadoPor,
          fechaAprobacion: i.fechaAprobacion,
          rechazadoPor: i.rechazadoPor,
          fechaRechazo: i.fechaRechazo,
          motivoRechazo: i.motivoRechazo
        });
      }
    }

    if (includeGastos) {
      const gastos = await listCollection('gastos');
      for (const g of gastos) {
        if (!inRange(g.fecha, desde, hasta)) continue;
        rows.push({
          tipo: 'gasto',
          id: g.id,
          fecha: g.fecha,
          fechaFormateada: g.fechaFormateada,
          ministerio: g.ministerio,
          ministerioId: g.ministerioId,
          descripcion: g.descripcion,
          monto: g.monto,
          estado: g.estado,
          auditCreadoPorId: g.auditCreadoPorId,
          auditCreadoPorNombre: g.auditCreadoPorNombre,
          auditCreadoEn: g.auditCreadoEn,
          auditActualizadoPorId: g.auditActualizadoPorId,
          auditActualizadoPorNombre: g.auditActualizadoPorNombre,
          auditActualizadoEn: g.auditActualizadoEn,
          aprobadoPor: g.aprobadoPor,
          fechaAprobacion: g.fechaAprobacion,
          rechazadoPor: g.rechazadoPor,
          fechaRechazo: g.fechaRechazo,
          motivoRechazo: g.motivoRechazo
        });
      }
    }

    // Ordena por fecha desc si existe
    rows.sort((a, b) => {
      const da = a.fecha ? new Date(a.fecha).getTime() : 0;
      const dbb = b.fecha ? new Date(b.fecha).getTime() : 0;
      return dbb - da;
    });

    const headers = [
      'tipo',
      'id',
      'fecha',
      'fechaFormateada',
      'ministerio',
      'ministerioId',
      'descripcion',
      'monto',
      'estado',
      'auditCreadoPorId',
      'auditCreadoPorNombre',
      'auditCreadoEn',
      'auditActualizadoPorId',
      'auditActualizadoPorNombre',
      'auditActualizadoEn',
      'aprobadoPor',
      'fechaAprobacion',
      'rechazadoPor',
      'fechaRechazo',
      'motivoRechazo'
    ];

    const csv = toCsv(rows, headers);
    const stamp = new Date().toISOString().substring(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="auditoria_ieca_${stamp}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error('[admin GET auditoria]', err);
    res.status(500).json({ message: 'Error al generar auditoría' });
  }
});

module.exports = router;
