const express = require('express');
const { ROLES } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParamSchema } = require('../schemas/common.schema');
const {
  createNotificacionSchema,
  marcarPorRutaSchema,
  marcarPorTipoSchema
} = require('../schemas/notificaciones.schema');
const {
  createNotificacion,
  listNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  marcarLeidasPorRuta,
  marcarLeidasPorTipo
} = require('../utils/notificaciones');

const router = express.Router();

const ROLES_NOTIF = [ROLES.ADMIN, ROLES.CONTABLE];

function requireNotifRole(req, res, next) {
  const rol = req.user?.rol;
  if (!rol || !ROLES_NOTIF.includes(rol)) {
    return res.status(403).json({
      message: 'Solo administradores y contables pueden gestionar notificaciones'
    });
  }
  return next();
}

router.use(requireNotifRole);

/** GET /api/notificaciones — listar (más recientes primero). */
router.get('/', async (_req, res) => {
  try {
    const lista = await listNotificaciones();
    res.json(lista);
  } catch (err) {
    console.error('[notificaciones GET]', err);
    res.status(500).json({ message: 'Error al listar notificaciones' });
  }
});

/** POST /api/notificaciones — crear (p. ej. cierre mensual). */
router.post('/', validate(createNotificacionSchema), async (req, res) => {
  try {
    const { tipo, titulo, mensaje, ruta } = req.body;
    const created = await createNotificacion({ tipo, titulo, mensaje, ruta });
    res.status(201).json(created);
  } catch (err) {
    console.error('[notificaciones POST]', err);
    res.status(500).json({ message: 'Error al crear notificación' });
  }
});

/** PATCH /api/notificaciones/marcar-todas */
router.patch('/marcar-todas', async (req, res) => {
  try {
    const lista = await marcarTodasLeidas(req.user.sub);
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
    const lista = await marcarLeidasPorRuta(req.user.sub, ruta);
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
    const lista = await marcarLeidasPorTipo(req.user.sub, tipo);
    res.json(lista);
  } catch (err) {
    console.error('[notificaciones PATCH marcar-por-tipo]', err);
    res.status(500).json({ message: 'Error al marcar notificaciones' });
  }
});

/** PATCH /api/notificaciones/:id/leida */
router.patch('/:id/leida', validate(idParamSchema, 'params'), async (req, res) => {
  try {
    const updated = await marcarLeida(req.params.id, req.user.sub);
    if (!updated) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    res.json(updated);
  } catch (err) {
    console.error('[notificaciones PATCH :id/leida]', err);
    res.status(500).json({ message: 'Error al marcar notificación' });
  }
});

module.exports = router;
