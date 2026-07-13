const express = require('express');
const { validate } = require('../middleware/validate');
const { idParamSchema } = require('../schemas/common.schema');
const {
  createNotificacionSchema,
  marcarPorRutaSchema,
  marcarPorTipoSchema
} = require('../schemas/notificaciones.schema');
const {
  createNotificacion,
  listNotificacionesForUser,
  userPuedeNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  marcarLeidasPorRuta,
  marcarLeidasPorTipo
} = require('../utils/notificaciones');
const { ROLES } = require('../middleware/auth');
const { invalidateBootstrapCache } = require('../utils/bootstrapCache');

const router = express.Router();

function requireNotifRole(req, res, next) {
  if (!userPuedeNotificaciones(req.user)) {
    return res.status(403).json({
      message: 'No tienes permiso para ver notificaciones'
    });
  }
  return next();
}

function requireStaffNotifRole(req, res, next) {
  const rol = req.user?.rol;
  if (rol !== ROLES.ADMIN && rol !== ROLES.CONTABLE) {
    return res.status(403).json({
      message: 'Solo administradores y contables pueden crear notificaciones del sistema'
    });
  }
  return next();
}

router.use(requireNotifRole);

/** GET /api/notificaciones — listar según rol (staff o líder de su ministerio). */
router.get('/', async (req, res) => {
  try {
    const lista = await listNotificacionesForUser(req.user);
    res.json(lista);
  } catch (err) {
    console.error('[notificaciones GET]', err);
    res.status(500).json({ message: 'Error al listar notificaciones' });
  }
});

/** POST /api/notificaciones — crear (cierre mensual, etc.; solo staff). */
router.post('/', requireStaffNotifRole, validate(createNotificacionSchema), async (req, res) => {
  try {
    const { tipo, titulo, mensaje, ruta, entityId } = req.body;
    const created = await createNotificacion({
      tipo,
      titulo,
      mensaje,
      ruta,
      entityId,
      audiencia: 'staff',
      origenRol: ROLES.ADMIN
    });
    invalidateBootstrapCache();
    res.status(201).json(created);
  } catch (err) {
    console.error('[notificaciones POST]', err);
    res.status(500).json({ message: 'Error al crear notificación' });
  }
});

/** PATCH /api/notificaciones/marcar-todas */
router.patch('/marcar-todas', async (req, res) => {
  try {
    const lista = await marcarTodasLeidas(req.user.sub, req.user);
    res.json(lista);
  } catch (err) {
    console.error('[notificaciones PATCH marcar-todas]', err);
    res.status(500).json({ message: 'Error al marcar notificaciones' });
  }
});

/** PATCH /api/notificaciones/marcar-por-ruta */
router.patch('/marcar-por-ruta', validate(marcarPorRutaSchema), async (req, res) => {
  try {
    const { ruta } = req.body;
    const lista = await marcarLeidasPorRuta(req.user.sub, ruta, req.user);
    res.json(lista);
  } catch (err) {
    console.error('[notificaciones PATCH marcar-por-ruta]', err);
    res.status(500).json({ message: 'Error al marcar notificaciones' });
  }
});

/** PATCH /api/notificaciones/marcar-por-tipo */
router.patch('/marcar-por-tipo', validate(marcarPorTipoSchema), async (req, res) => {
  try {
    const { tipo } = req.body;
    const lista = await marcarLeidasPorTipo(req.user.sub, tipo, req.user);
    res.json(lista);
  } catch (err) {
    console.error('[notificaciones PATCH marcar-por-tipo]', err);
    res.status(500).json({ message: 'Error al marcar notificaciones' });
  }
});

/** PATCH /api/notificaciones/:id/leida */
router.patch('/:id/leida', validate(idParamSchema, 'params'), async (req, res) => {
  try {
    const updated = await marcarLeida(req.params.id, req.user.sub, req.user);
    if (!updated) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    const lista = await listNotificacionesForUser(req.user);
    res.json(lista.find((n) => n.id === String(updated.id)) ?? updated);
  } catch (err) {
    console.error('[notificaciones PATCH :id/leida]', err);
    res.status(500).json({ message: 'Error al marcar notificación' });
  }
});

module.exports = router;
