const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');
const { listCollection } = require('./firestore');
const { sendPasswordResetEmail } = require('./email');
const { normalizeEmail } = require('./email-normalize');
const { smtpConfigured, isProduction } = require('../config/env');

const COLLECTION = 'password_resets';
const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const MSG_GENERICO =
  'Si el usuario existe y tiene email registrado, recibirás un código en unos minutos.';

function generateCode() {
  return String(crypto.randomInt(100000, 999999));
}

function maskEmail(email) {
  const s = String(email || '').trim();
  const at = s.indexOf('@');
  if (at <= 1) return 'tu correo';
  const user = s.slice(0, at);
  const domain = s.slice(at + 1);
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

/** @param {unknown} login @returns {Promise<import('../types/firestore.types').UsuarioDoc | null>} */
async function findUserByLogin(login) {
  const raw = String(login ?? '').trim();
  if (!raw) return null;

  const byUsuario = await db.collection('usuarios')
    .where('usuario', '==', raw)
    .limit(1)
    .get();
  if (!byUsuario.empty) {
    return { id: byUsuario.docs[0].id, ...byUsuario.docs[0].data() };
  }

  const byUsuarioLower = await db.collection('usuarios')
    .where('usuario', '==', raw.toLowerCase())
    .limit(1)
    .get();
  if (!byUsuarioLower.empty) {
    return { id: byUsuarioLower.docs[0].id, ...byUsuarioLower.docs[0].data() };
  }

  const emailNorm = normalizeEmail(raw);
  if (emailNorm) {
    const byEmail = await db.collection('usuarios')
      .where('email', '==', emailNorm)
      .limit(1)
      .get();
    if (!byEmail.empty) {
      return { id: byEmail.docs[0].id, ...byEmail.docs[0].data() };
    }

    const usuarios = await listCollection('usuarios');
    const porEmail = usuarios.find(u => normalizeEmail(u.email) === emailNorm);
    if (porEmail) {
      return { id: String(porEmail.id), ...porEmail };
    }
  }

  return null;
}

/**
 * Crea código temporal y lo envía al email del usuario (si existe).
 * Respuesta genérica si no hay usuario (no revela existencia).
 */
async function requestPasswordReset(login) {
  const user = await findUserByLogin(login);

  if (!user || (user.estado && user.estado !== 'Activo')) {
    return {
      message: MSG_GENERICO,
      codeDispatched: false,
      emailSent: false,
      channel: 'none',
      devCode: undefined
    };
  }

  const email = normalizeEmail(user.email);
  if (!email) {
    return {
      message: MSG_GENERICO,
      codeDispatched: false,
      emailSent: false,
      channel: 'none',
      devCode: undefined
    };
  }

  if (isProduction && !smtpConfigured) {
    const err = new Error(
      'La recuperación por correo no está activa. El administrador debe configurar SMTP en Render ' +
      '(SMTP_HOST, SMTP_USER, SMTP_PASS y opcional SMTP_FROM).'
    );
    err.status = 503;
    throw err;
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

  try {
    const mail = await sendPasswordResetEmail({
      to: email,
      usuario: user.usuario || user.nombre || 'usuario',
      code
    });

    if (mail.channel === 'email') {
      return {
        message:
          `Enviamos un código de 6 dígitos a ${maskEmail(email)}. ` +
          'Revisa también spam o correo no deseado (válido 15 minutos).',
        codeDispatched: true,
        emailSent: true,
        channel: 'email',
        devCode: undefined
      };
    }

    return {
      message:
        'Correo no configurado en el servidor. Usa el código que aparece en pantalla para continuar.',
      codeDispatched: true,
      emailSent: false,
      channel: 'console',
      devCode: mail.devCode
    };
  } catch (err) {
    await db.collection(COLLECTION).doc(String(user.id)).delete().catch(() => undefined);
    throw err;
  }
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
    { passwordHash, mustChangePassword: false, passwordChangedAt: Date.now() },
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
