const { db } = require('../config/firebase');

const COLLECTION = 'login_auditoria';

/**
 * Registra un intento de login (éxito o fallo) con IP y motivo.
 */
async function recordLoginAttempt({ ip, usuario, success, reason = null }) {
  try {
    await db.collection(COLLECTION).add({
      ip: String(ip || 'desconocida'),
      usuario: usuario ? String(usuario).trim() : null,
      success: !!success,
      reason: reason || null,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[loginAudit] No se pudo registrar intento:', err.message);
  }
}

/**
 * Lista intentos fallidos recientes (para panel admin).
 */
async function listFailedLoginAttempts(limit = 50) {
  const snap = await db.collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(Math.min(limit * 4, 200))
    .get();

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((row) => !(/** @type {import('../types/firestore.types').LoginAuditDoc} */ (row)).success)
    .slice(0, Math.min(limit, 200));
}

module.exports = {
  recordLoginAttempt,
  listFailedLoginAttempts,
  COLLECTION
};
