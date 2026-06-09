const express = require('express');
const { listCollection, listCollectionByField, stripInternalFields } = require('../utils/firestore');
const { ROLES } = require('../middleware/auth');
const { listNotificacionesForUser, userPuedeNotificaciones } = require('../utils/notificaciones');
const { getCachedBootstrap, setCachedBootstrap } = require('../utils/bootstrapCache');

const router = express.Router();

function scopeForUser(user) {
  if (user?.rol !== ROLES.LIDER || user?.ministerioId == null) return null;
  return { field: 'ministerioId', value: Number(user.ministerioId) };
}

async function listScoped(collection, scope) {
  if (scope) {
    return listCollectionByField(collection, scope.field, scope.value);
  }
  return listCollection(collection);
}

/** GET /api/bootstrap — carga inicial en una sola petición (menos latencia). */
router.get('/', async (req, res) => {
  try {
    const user = req.user;
    const cached = getCachedBootstrap(user);
    if (cached) {
      res.set('X-Bootstrap-Cache', 'HIT');
      res.set('Cache-Control', 'private, max-age=30');
      return res.json(cached);
    }

    const rol = user?.rol;
    const scope = scopeForUser(user);
    const isAdmin = rol === ROLES.ADMIN;

    const tasks = {
      ingresos: listScoped('ingresos', scope),
      gastos: listScoped('gastos', scope)
    };

    if (isAdmin) {
      Object.assign(tasks, {
        ministerios: listCollection('ministerios'),
        usuarios: listCollection('usuarios').then((lista) =>
          lista.map((row) => stripInternalFields(row))
        )
      });
    }

    if (userPuedeNotificaciones(user)) {
      Object.assign(tasks, {
        notificaciones: listNotificacionesForUser(user)
      });
    }

    const keys = Object.keys(tasks);
    const values = await Promise.all(Object.values(tasks));
    const payload = Object.fromEntries(keys.map((key, i) => [key, values[i]]));

    setCachedBootstrap(user, payload);
    res.set('X-Bootstrap-Cache', 'MISS');
    res.set('Cache-Control', 'private, max-age=30');
    res.json(payload);
  } catch (err) {
    console.error('[bootstrap GET]', err);
    res.status(500).json({ message: 'Error al cargar datos iniciales' });
  }
});

module.exports = router;
