const express = require('express');
const bcrypt = require('bcryptjs');
const {
  listCollection,
  listCollectionByField,
  getById,
  createInCollection,
  updateInCollection,
  deleteFromCollection,
  formatDateDDMMYYYY
} = require('../utils/firestore');
const { ROLES } = require('../middleware/auth');
const { db } = require('../config/firebase');
const { createNotificacion } = require('../utils/notificaciones');
const {
  onCreateGasto,
  onUpdateGasto,
  beforeCreateGasto,
  beforeUpdateGasto,
  assertGastoModificable,
  notificarGastoCreado,
  afterUpdateGasto,
  afterDeleteGasto,
  aprobarGasto,
  rechazarGasto
} = require('../utils/gastos');
const {
  onCreateIngreso,
  onUpdateIngreso,
  beforeCreateIngreso,
  beforeUpdateIngreso,
  assertIngresoModificable,
  afterCreateIngreso,
  afterUpdateIngreso,
  afterDeleteIngreso,
  aprobarIngreso,
  rechazarIngreso
} = require('../utils/ingresos');
const { applyAuditCreacion, applyAuditActualizacion } = require('../utils/auditoria');
const {
  normalizarYValidarUsuario,
  validarMinisterioLiderazgo,
  sincronizarLideresMinisterio
} = require('../utils/liderazgo');
const { normalizeEmail } = require('../utils/email-normalize');
const {
  assertMinisterioNombreUnico,
  assertUsuarioEmailUnico,
  assertUsuarioLoginUnico
} = require('../utils/unicidad');
const { validate } = require('../middleware/validate');
const { invalidateBootstrapCache } = require('../utils/bootstrapCache');
const { idParamSchema, motivoRechazoSchema } = require('../schemas/common.schema');
const {
  ingresoCreateSchema,
  ingresoUpdateSchema,
  gastoCreateSchema,
  gastoUpdateSchema,
  ministerioCreateSchema,
  ministerioUpdateSchema,
  usuarioCreateSchema,
  usuarioUpdateSchema
} = require('../schemas/crud.schema');

function generateTempPassword(length = 10) {
  // Evita caracteres confusos, y asegura mezcla básica
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function slugifyUsuario(input) {
  const s = String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')    // quita símbolos raros
    .replace(/\s+/g, ' ')
    .trim();

  if (!s) return '';
  const parts = s.split(' ').filter(Boolean);
  const first = parts[0] ?? 'user';
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  return (last ? `${first}.${last}` : first).slice(0, 20);
}

async function ensureUniqueUsuario(base) {
  let candidate = base || 'user';
  let i = 0;
  while (true) {
    const snap = await db.collection('usuarios').where('usuario', '==', candidate).limit(1).get();
    if (snap.empty) return candidate;
    i += 1;
    candidate = `${base || 'user'}${i}`.slice(0, 20);
  }
}

function createCrudRouter(collection, options: {
  onCreate?: Function;
  onUpdate?: Function;
  afterCreate?: Function;
  afterUpdate?: Function;
  afterDelete?: Function;
  scopeField?: string;
  allowPassword?: boolean;
  generatePasswordOnCreate?: boolean;
  canModify?: Function;
  beforeCreate?: Function;
  beforeUpdate?: Function;
  audit?: boolean;
  validateCreate?: unknown;
  validateUpdate?: unknown;
} = {}) {
  const router = express.Router();
  const {
    onCreate,
    onUpdate,
    afterCreate,
    afterUpdate,
    afterDelete,
    scopeField,
    allowPassword,
    generatePasswordOnCreate,
    canModify,
    beforeCreate,
    beforeUpdate,
    audit,
    validateCreate,
    validateUpdate
  } = options;

  function getUserScope(req) {
    if (!scopeField) return null;
    const rol = req.user?.rol;
    if (rol !== ROLES.LIDER) return null;
    const ministerioId = req.user?.ministerioId;
    if (ministerioId == null) return null;
    return { field: scopeField, value: Number(ministerioId) };
  }

  function ensureScope(req, body) {
    const scope = getUserScope(req);
    if (!scope) return body;
    // Fuerza el scope del líder, evita ver/escribir en otro ministerio
    return { ...body, [scope.field]: scope.value };
  }

  async function assertScopeAllowed(req, entity) {
    const scope = getUserScope(req);
    if (!scope) return true;
    return Number(entity?.[scope.field]) === Number(scope.value);
  }

  async function maybeHashPassword(body) {
    if (!allowPassword) return body;
    const { password, ...rest } = body ?? {};
    if (!password) return rest;
    const passwordHash = await bcrypt.hash(String(password), 10);
    return { ...rest, passwordHash };
  }

  router.get('/', async (_req, res) => {
    try {
      const scope = getUserScope(_req);
      const lista = scope
        ? await listCollectionByField(collection, scope.field, scope.value)
        : await listCollection(collection);
      res.json(lista);
    } catch (err) {
      console.error(`[${collection} GET]`, err);
      res.status(500).json({ message: `Error al listar ${collection}` });
    }
  });

  router.get('/:id', validate(idParamSchema, 'params'), async (req, res) => {
    try {
      const item = await getById(collection, req.params.id);
      if (!item) return res.status(404).json({ message: 'No encontrado' });
      const ok = await assertScopeAllowed(req, item);
      if (!ok) return res.status(403).json({ message: 'No tienes permisos para ver este registro' });
      res.json(item);
    } catch (err) {
      console.error(`[${collection} GET/:id]`, err);
      res.status(500).json({ message: 'Error al obtener registro' });
    }
  });

  router.post('/', ...(validateCreate ? [validate(validateCreate)] : []), async (req, res) => {
    try {
      let body = { ...req.body };
      body = ensureScope(req, body);
      if (beforeCreate) {
        try {
          await beforeCreate(body, req);
        } catch (err) {
          const status = err.status || 403;
          return res.status(status).json({ message: err.message || 'Operación no permitida' });
        }
      }
      if (onCreate) body = onCreate(body, req);

      // Para usuarios: si no viene "usuario", generarlo desde "nombre" y hacerlo único.
      if (collection === 'usuarios') {
        const provided = String(body.usuario ?? '').trim();
        if (!provided) {
          const base = slugifyUsuario(body.nombre);
          body.usuario = await ensureUniqueUsuario(base);
        } else {
          body.usuario = provided;
          await assertUsuarioLoginUnico(body.usuario, null);
        }
      }

      let tempPassword;
      if (allowPassword && generatePasswordOnCreate) {
        const provided = String(body.password ?? '').trim();
        if (!provided) {
          tempPassword = generateTempPassword();
          body.password = tempPassword;
        }
      }

      // Flag para forzar cambio de contraseña al primer ingreso
      if (allowPassword && generatePasswordOnCreate) {
        body.mustChangePassword = !!tempPassword;
      }

      body = await maybeHashPassword(body);
      if (audit) {
        body = await applyAuditCreacion(body, req);
      }
      const created = await createInCollection(collection, body);

      let responseBody = created;
      if (afterCreate) {
        try {
          const result = await afterCreate(created, req);
          if (result) responseBody = result;
        } catch (notifErr) {
          console.error(`[${collection} afterCreate notificación]`, notifErr);
        }
      }

      invalidateBootstrapCache();

      // Devolver la contraseña temporal SOLO en la creación, una vez.
      res.status(201).json(tempPassword ? { ...responseBody, tempPassword } : responseBody);
    } catch (err) {
      console.error(`[${collection} POST]`, err);
      res.status(500).json({ message: 'Error al crear registro' });
    }
  });

  router.put('/:id', validate(idParamSchema, 'params'), ...(validateUpdate ? [validate(validateUpdate)] : []), async (req, res) => {
    try {
      const current = await getById(collection, req.params.id);
      if (!current) return res.status(404).json({ message: 'No encontrado' });
      const ok = await assertScopeAllowed(req, current);
      if (!ok) return res.status(403).json({ message: 'No tienes permisos para modificar este registro' });

      if (canModify) {
        const perm = await canModify(req, current);
        if (!perm.ok) {
          return res.status(403).json({ message: perm.message || 'No tienes permisos' });
        }
      }

      let body = { ...req.body };
      body = ensureScope(req, body);
      if (beforeUpdate) {
        try {
          await beforeUpdate(body, req, current);
        } catch (err) {
          const status = err.status || 403;
          return res.status(status).json({ message: err.message || 'Operación no permitida' });
        }
      }
      try {
        if (onUpdate) body = onUpdate(body, req, current);
      } catch (err) {
        const status = err.status || 400;
        return res.status(status).json({ message: err.message || 'Error de validación' });
      }
      // Si cambia password explícitamente, deja de requerir cambio forzado
      if (allowPassword && body.password) {
        body.mustChangePassword = false;
      }
      body = await maybeHashPassword(body);
      if (audit) {
        body = await applyAuditActualizacion(body, req, current);
      }
      const updated = await updateInCollection(collection, req.params.id, body);
      if (!updated) return res.status(404).json({ message: 'No encontrado' });
      if (afterUpdate) {
        try {
          await afterUpdate(updated, req, current);
        } catch (hookErr) {
          console.error(`[${collection} afterUpdate]`, hookErr);
        }
      }
      invalidateBootstrapCache();
      res.json(updated);
    } catch (err) {
      console.error(`[${collection} PUT]`, err);
      res.status(500).json({ message: 'Error al actualizar registro' });
    }
  });

  router.delete('/:id', validate(idParamSchema, 'params'), async (req, res) => {
    try {
      const current = await getById(collection, req.params.id);
      if (!current) return res.status(404).json({ message: 'No encontrado' });
      const ok = await assertScopeAllowed(req, current);
      if (!ok) return res.status(403).json({ message: 'No tienes permisos para eliminar este registro' });

      if (canModify) {
        const perm = await canModify(req, current);
        if (!perm.ok) {
          return res.status(403).json({ message: perm.message || 'No tienes permisos' });
        }
      }

      if (afterDelete) {
        try {
          await afterDelete(current, req);
        } catch (hookErr) {
          console.error(`[${collection} afterDelete]`, hookErr);
        }
      }

      const deleted = await deleteFromCollection(collection, req.params.id);
      if (!deleted) return res.status(404).json({ message: 'No encontrado' });
      invalidateBootstrapCache();
      res.status(204).send();
    } catch (err) {
      console.error(`[${collection} DELETE]`, err);
      res.status(500).json({ message: 'Error al eliminar registro' });
    }
  });

  return router;
}

async function beforeCreateMinisterio(body) {
  if (body.nombre != null) {
    body.nombre = String(body.nombre).trim();
  }
  await assertMinisterioNombreUnico(body.nombre, null);
  await validarMinisterioLiderazgo(body, null);
}

async function beforeUpdateMinisterio(body, _req, current) {
  if (body.nombre != null) {
    body.nombre = String(body.nombre).trim();
    await assertMinisterioNombreUnico(body.nombre, current?.id ?? null);
  }
  await validarMinisterioLiderazgo(body, current?.id ?? null);
}

async function afterSaveMinisterio(ministerio) {
  if (ministerio?.id != null) {
    await sincronizarLideresMinisterio(ministerio);
  }
}

async function beforeCreateUsuario(body) {
  if (body.email != null) {
    body.email = normalizeEmail(body.email) ?? body.email;
    await assertUsuarioEmailUnico(body.email, null);
  }
  if (body.usuario != null && String(body.usuario).trim()) {
    body.usuario = String(body.usuario).trim();
    await assertUsuarioLoginUnico(body.usuario, null);
  }
  await normalizarYValidarUsuario(body, null);
}

async function beforeUpdateUsuario(body, _req, current) {
  const excludeId = current?.id ?? null;
  if (body.email != null) {
    body.email = normalizeEmail(body.email) ?? body.email;
    await assertUsuarioEmailUnico(body.email, excludeId);
  }
  if (body.usuario != null && String(body.usuario).trim()) {
    body.usuario = String(body.usuario).trim();
    await assertUsuarioLoginUnico(body.usuario, excludeId);
  }
  await normalizarYValidarUsuario(body, excludeId);
}

const ministeriosRouter = createCrudRouter('ministerios', {
  validateCreate: ministerioCreateSchema,
  validateUpdate: ministerioUpdateSchema,
  onCreate(body) {
    const ahora = new Date().toISOString();
    const { id, fecha, fechaFormateada, ...rest } = body;
    return {
      ...rest,
      fecha: ahora,
      fechaFormateada: formatDateDDMMYYYY(ahora)
    };
  },
  beforeCreate: beforeCreateMinisterio,
  beforeUpdate: beforeUpdateMinisterio,
  afterCreate: afterSaveMinisterio,
  afterUpdate: afterSaveMinisterio
});

const usuariosRouter = createCrudRouter('usuarios', {
  validateCreate: usuarioCreateSchema,
  validateUpdate: usuarioUpdateSchema,
  allowPassword: true,
  generatePasswordOnCreate: true,
  beforeCreate: beforeCreateUsuario,
  beforeUpdate: beforeUpdateUsuario
});
const ingresosRouter = createCrudRouter('ingresos', {
  validateCreate: ingresoCreateSchema,
  validateUpdate: ingresoUpdateSchema,
  scopeField: 'ministerioId',
  onCreate: onCreateIngreso,
  onUpdate: onUpdateIngreso,
  beforeCreate: beforeCreateIngreso,
  beforeUpdate: beforeUpdateIngreso,
  canModify: assertIngresoModificable,
  afterCreate: afterCreateIngreso,
  afterUpdate: afterUpdateIngreso,
  afterDelete: afterDeleteIngreso,
  audit: true
});

ingresosRouter.patch('/:id/aprobar', validate(idParamSchema, 'params'), async (req, res) => {
  try {
    const updated = await aprobarIngreso(req.params.id, req);
    if (!updated) return res.status(404).json({ message: 'Ingreso no encontrado' });
    invalidateBootstrapCache();
    res.json(updated);
  } catch (err) {
    console.error('[ingresos PATCH aprobar]', err);
    res.status(err.status || 500).json({ message: err.message || 'Error al aprobar' });
  }
});

ingresosRouter.patch('/:id/rechazar', validate(idParamSchema, 'params'), validate(motivoRechazoSchema), async (req, res) => {
  try {
    const { motivo } = req.body;
    const updated = await rechazarIngreso(req.params.id, req, motivo);
    if (!updated) return res.status(404).json({ message: 'Ingreso no encontrado' });
    invalidateBootstrapCache();
    res.json(updated);
  } catch (err) {
    console.error('[ingresos PATCH rechazar]', err);
    res.status(err.status || 500).json({ message: err.message || 'Error al rechazar' });
  }
});
const gastosRouter = createCrudRouter('gastos', {
  validateCreate: gastoCreateSchema,
  validateUpdate: gastoUpdateSchema,
  scopeField: 'ministerioId',
  onCreate: onCreateGasto,
  onUpdate: onUpdateGasto,
  beforeCreate: beforeCreateGasto,
  beforeUpdate: beforeUpdateGasto,
  canModify: assertGastoModificable,
  afterCreate: (created, req) => notificarGastoCreado(created, req),
  afterUpdate: afterUpdateGasto,
  afterDelete: afterDeleteGasto,
  audit: true
});

gastosRouter.patch('/:id/aprobar', validate(idParamSchema, 'params'), async (req, res) => {
  try {
    const updated = await aprobarGasto(req.params.id, req);
    if (!updated) return res.status(404).json({ message: 'Gasto no encontrado' });
    invalidateBootstrapCache();
    res.json(updated);
  } catch (err) {
    console.error('[gastos PATCH aprobar]', err);
    res.status(err.status || 500).json({ message: err.message || 'Error al aprobar' });
  }
});

gastosRouter.patch('/:id/rechazar', validate(idParamSchema, 'params'), validate(motivoRechazoSchema), async (req, res) => {
  try {
    const { motivo } = req.body;
    const updated = await rechazarGasto(req.params.id, req, motivo);
    if (!updated) return res.status(404).json({ message: 'Gasto no encontrado' });
    invalidateBootstrapCache();
    res.json(updated);
  } catch (err) {
    console.error('[gastos PATCH rechazar]', err);
    res.status(err.status || 500).json({ message: err.message || 'Error al rechazar' });
  }
});

module.exports = {
  ministeriosRouter,
  usuariosRouter,
  ingresosRouter,
  gastosRouter
};
