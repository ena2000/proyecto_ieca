const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');
const { sendPasswordResetEmail } = require('./email');

const COLLECTION = 'password_resets';
const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateCode() {
  return String(crypto.randomInt(100000, 999999));
}

/** @param {unknown} login @returns {Promise<import('../types/firestore.types').UsuarioDoc | null>} */
async function findUserByLogin(login) {
  const value = String(login ?? '').trim();
  if (!value) return null;

  const byUsuario = await db.collection('usuarios')
    .where('usuario', '==', value)
    .limit(1)
    .get();
  if (!byUsuario.empty) {
    return { id: byUsuario.docs[0].id, ...byUsuario.docs[0].data() };
  }

  const byEmail = await db.collection('usuarios')
    .where('email', '==', value.toLowerCase())
    .limit(1)
    .get();
  if (!byEmail.empty) {
    return { id: byEmail.docs[0].id, ...byEmail.docs[0].data() };
  }

  return null;
}

/**
 * Crea código temporal y lo envía al email del usuario (si existe).
 * Respuesta genérica para no revelar si el usuario existe.
 */
async function requestPasswordReset(login) {
  const user = await findUserByLogin(login);

  if (!user || (user.estado && user.estado !== 'Activo')) {
    return {
      message: 'Si el usuario existe y tiene email registrado, recibirás un código en unos minutos.',
      devCode: undefined
    };
  }

  if (!user.email?.trim()) {
    return {
      message: 'Si el usuario existe y tiene email registrado, recibirás un código en unos minutos.',
      devCode: undefined
    };
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  await db.collection(COLLECTION).doc(String(user.id)).set({
    userId: String(user.id),
    usuario: user.usuario,
    codeHash,
    attempts: 0,
    expiresAt,
    createdAt: new Date().toISOString()
  });

  let devCode;
  try {
    const result = await sendPasswordResetEmail({
      to: user.email,
      usuario: user.usuario || user.nombre || 'usuario',
      code
    });
    devCode = result.devCode;
  } catch (err) {
    await db.collection(COLLECTION).doc(String(user.id)).delete().catch(() => undefined);
    throw err;
  }

  return {
    message: 'Si el usuario existe y tiene email registrado, recibirás un código en unos minutos.',
    devCode
  };
}

/**
 * Verifica código y establece nueva contraseña.
 */
async function resetPasswordWithCode({ login, code, newPassword }) {
  const user = await findUserByLogin(login);
  if (!user) {
    const err = new Error('Código inválido o expirado');
    err.status = 400;
    throw err;
  }

  const ref = db.collection(COLLECTION).doc(String(user.id));
  const resetDoc = await ref.get();
  if (!resetDoc.exists) {
    const err = new Error('Código inválido o expirado');
    err.status = 400;
    throw err;
  }

  const data = resetDoc.data();
  if (new Date(data.expiresAt).getTime() < Date.now()) {
    await ref.delete();
    const err = new Error('El código expiró. Solicita uno nuevo.');
    err.status = 400;
    throw err;
  }

  if ((data.attempts ?? 0) >= MAX_ATTEMPTS) {
    await ref.delete();
    const err = new Error('Demasiados intentos. Solicita un código nuevo.');
    err.status = 429;
    throw err;
  }

  const ok = await bcrypt.compare(String(code), data.codeHash);
  if (!ok) {
    await ref.set({ attempts: (data.attempts ?? 0) + 1 }, { merge: true });
    const err = new Error('Código incorrecto');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await db.collection('usuarios').doc(String(user.id)).set(
    { passwordHash, mustChangePassword: false },
    { merge: true }
  );
  await ref.delete();

  return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}

module.exports = {
  requestPasswordReset,
  resetPasswordWithCode,
  findUserByLogin
};
