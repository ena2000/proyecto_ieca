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
const { invalidateBootstrapCache } = require('../utils/bootstrapCache');
const {
  AUDITORIA_CSV_HEADERS,
  buildMapaNombresUsuarios,
  mapMovimientoAuditoriaCsvRow,
  parseFechaCsvParaOrden
} = require('../utils/auditoria-csv');

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

function parseDateFilter(input, endOfDay = false) {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    d = new Date(`${s}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  } else {
    d = new Date(s);
  }
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseMovementDate(entity) {
  if (entity?.fecha) {
    const d = new Date(String(entity.fecha));
    if (!Number.isNaN(d.getTime())) return d;
  }
  const ff = entity?.fechaFormateada;
  if (typeof ff === 'string' && ff.length === 10 && ff.includes('/')) {
    const [dd, mm, yyyy] = ff.split('/');
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function inRange(entity, desde, hasta) {
  const d = parseMovementDate(entity);
  if (!d) return true;
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
  const batchSize = 400;
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
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
    invalidateBootstrapCache();
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
  invalidateBootstrapCache();
  res.json(result);
}));

/** DELETE /api/admin/datos — vaciar colecciones principales (solo admin). */
router.delete('/datos', async (_req, res) => {
  try {
    for (const name of COLLECTIONS_RESET) {
      await clearCollection(name);
    }
    await clearCollection('password_resets');
    await db.collection('config').doc('sistema').set(
      { ultimoCierre: null, periodosCerrados: [] },
      { merge: true }
    );
    // Resetear contadores de ID
    try {
      const { syncCounterToMax } = require('../utils/firestore');
      for (const name of COLLECTIONS_RESET) {
        await syncCounterToMax(name);
      }
    } catch (counterErr) {
      console.warn('[admin DELETE datos] contadores:', counterErr?.message || counterErr);
    }
    invalidateBootstrapCache();
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
    const tipo = req.query.tipo ?? 'todos';
    const desdeStr = req.query.desde;
    const hastaStr = req.query.hasta;
    const desde = parseDateFilter(desdeStr, false);
    const hasta = parseDateFilter(hastaStr, true);

    const includeIngresos = tipo === 'todos' || tipo === 'ingresos';
    const includeGastos = tipo === 'todos' || tipo === 'gastos';

    const [usuarios, ingresosRaw, gastosRaw] = await Promise.all([
      listCollection('usuarios'),
      includeIngresos ? listCollection('ingresos') : Promise.resolve([]),
      includeGastos ? listCollection('gastos') : Promise.resolve([])
    ]);

    const mapaUsuarios = buildMapaNombresUsuarios(usuarios);
    const rows = [];

    if (includeIngresos) {
      for (const i of ingresosRaw) {
        if (!inRange(i, desde, hasta)) continue;
        rows.push(mapMovimientoAuditoriaCsvRow(i, 'ingreso', mapaUsuarios));
      }
    }

    if (includeGastos) {
      for (const g of gastosRaw) {
        if (!inRange(g, desde, hasta)) continue;
        rows.push(mapMovimientoAuditoriaCsvRow(g, 'gasto', mapaUsuarios));
      }
    }

    rows.sort((a, b) => parseFechaCsvParaOrden(b.fechaFormateada) - parseFechaCsvParaOrden(a.fechaFormateada));

    const headers = [...AUDITORIA_CSV_HEADERS];

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
