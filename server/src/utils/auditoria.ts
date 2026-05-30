const { getById } = require('./firestore');

const AUDIT_KEYS = [
  'auditCreadoPorId',
  'auditCreadoPorNombre',
  'auditCreadoEn',
  'auditActualizadoPorId',
  'auditActualizadoPorNombre',
  'auditActualizadoEn'
];

function stripAuditFields(body) {
  if (!body || typeof body !== 'object') return body;
  const out = { ...body };
  for (const key of AUDIT_KEYS) {
    delete out[key];
  }
  return out;
}

async function resolveActor(req) {
  const id = req.user?.sub;
  if (!id) {
    return { id: null, nombre: 'Sistema' };
  }

  try {
    const u = await getById('usuarios', id);
    if (u) {
      const nombre = String(u.nombre || u.usuario || `Usuario #${id}`).trim();
      return { id: String(id), nombre };
    }
  } catch {
    // fallback below
  }

  return { id: String(id), nombre: `Usuario #${id}` };
}

function stampCreacion(body, actor, now = new Date().toISOString()) {
  const nombre = actor?.nombre || 'Sistema';
  const actorId = actor?.id != null ? String(actor.id) : null;
  return {
    ...stripAuditFields(body),
    auditCreadoPorId: actorId,
    auditCreadoPorNombre: nombre,
    auditCreadoEn: now,
    auditActualizadoPorId: actorId,
    auditActualizadoPorNombre: nombre,
    auditActualizadoEn: now
  };
}

function stampActualizacion(body, actor, current, now = new Date().toISOString()) {
  const nombre = actor?.nombre || 'Sistema';
  const actorId = actor?.id != null ? String(actor.id) : null;
  return {
    ...stripAuditFields(body),
    auditCreadoPorId: current?.auditCreadoPorId ?? actorId,
    auditCreadoPorNombre: current?.auditCreadoPorNombre ?? nombre,
    auditCreadoEn: current?.auditCreadoEn ?? now,
    auditActualizadoPorId: actorId,
    auditActualizadoPorNombre: nombre,
    auditActualizadoEn: now
  };
}

async function applyAuditCreacion(body, req) {
  const actor = await resolveActor(req);
  return stampCreacion(body, actor);
}

async function applyAuditActualizacion(body, req, current) {
  const actor = await resolveActor(req);
  return stampActualizacion(body, actor, current);
}

module.exports = {
  stripAuditFields,
  resolveActor,
  stampCreacion,
  stampActualizacion,
  applyAuditCreacion,
  applyAuditActualizacion
};
