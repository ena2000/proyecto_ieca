const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');
const { signTokenPair, verifyRefreshToken, authRequired } = require('../middleware/auth');
const { stripInternalFields } = require('../utils/firestore');
const { validate } = require('../middleware/validate');
const { loginLimiter, forgotPasswordLimiter } = require('../middleware/rateLimit');
const {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema
} = require('../schemas/auth.schema');
const { getClientIp } = require('../utils/request');
const { recordLoginAttempt } = require('../utils/loginAudit');
const { requestPasswordReset, resetPasswordWithCode } = require('../utils/passwordReset');
const { smtpConfigured } = require('../config/env');

const router = express.Router();

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const ip = getClientIp(req);
  const { usuario, password } = req.body;

  try {
    const snap = await db.collection('usuarios')
      .where('usuario', '==', usuario.trim())
      .limit(1)
      .get();

    if (snap.empty) {
      await recordLoginAttempt({ ip, usuario, success: false, reason: 'usuario_no_encontrado' });
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    if (data.estado && data.estado !== 'Activo') {
      await recordLoginAttempt({ ip, usuario, success: false, reason: 'usuario_inactivo' });
      return res.status(401).json({ message: 'Usuario inactivo' });
    }

    if (!data.passwordHash) {
      await recordLoginAttempt({ ip, usuario, success: false, reason: 'sin_password' });
      return res.status(401).json({
        message: 'Usuario sin contraseña configurada. Ejecuta: npm run seed'
      });
    }

    const ok = await bcrypt.compare(password, data.passwordHash);
    if (!ok) {
      await recordLoginAttempt({ ip, usuario, success: false, reason: 'password_incorrecta' });
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const id = Number(doc.id);
    const user = stripInternalFields({
      id: Number.isNaN(id) ? doc.id : id,
      usuario: data.usuario,
      email: data.email,
      rol: data.rol,
      ministerioId: data.ministerioId,
      mustChangePassword: !!data.mustChangePassword
    });

    void recordLoginAttempt({ ip, usuario, success: true, reason: 'login_ok' });
    const { token, refreshToken } = signTokenPair(user);
    return res.json({ token, refreshToken, user });
  } catch (err) {
    console.error('[auth/login]', err);
    await recordLoginAttempt({ ip, usuario, success: false, reason: 'error_servidor' });
    return res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

router.post('/logout', (_req, res) => {
  res.status(204).send();
});

/** Renueva el access token con un refresh token válido. */
router.post('/refresh', validate(refreshSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const payload = verifyRefreshToken(refreshToken);

    const ref = db.collection('usuarios').doc(String(payload.sub));
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(401).json({ message: 'Sesión inválida' });
    }

    const data = doc.data();
    if (data?.estado && data.estado !== 'Activo') {
      return res.status(401).json({ message: 'Usuario inactivo' });
    }

    // Invalidar refresh emitidos antes de un cambio de contraseña
    const changedAt = Number(data?.passwordChangedAt || 0);
    if (changedAt > 0 && payload.iat && payload.iat * 1000 < changedAt) {
      return res.status(401).json({ message: 'Sesión inválida. Inicia sesión de nuevo.' });
    }

    const id = Number(doc.id);
    const user = stripInternalFields({
      id: Number.isNaN(id) ? doc.id : id,
      usuario: data?.usuario,
      email: data?.email,
      rol: data?.rol,
      ministerioId: data?.ministerioId,
      mustChangePassword: !!data?.mustChangePassword
    });

    const tokens = signTokenPair(user);
    return res.json({ token: tokens.token, refreshToken: tokens.refreshToken, user });
  } catch (err) {
    console.error('[auth/refresh]', err);
    return res.status(401).json({ message: 'Sesión expirada. Inicia sesión de nuevo.' });
  }
});

/** Solicitar código de recuperación (email o consola en desarrollo). */
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), async (req, res) => {
  try {
    const { usuario } = req.body;
    const result = await requestPasswordReset(usuario);
    const payload: Record<string, unknown> = {
      message: result.message,
      codeDispatched: result.codeDispatched,
      emailSent: result.emailSent,
      channel: result.channel
    };
    if (result.devCode) {
      payload.devCode = result.devCode;
    }
    if (!smtpConfigured && process.env.NODE_ENV !== 'production') {
      console.warn('[auth/forgot-password] SMTP no configurado — código en respuesta dev/console.');
    }
    return res.json(payload);
  } catch (err) {
    console.error('[auth/forgot-password]', err);
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || 'No se pudo procesar la solicitud'
    });
  }
});

/** Restablecer contraseña con código temporal de 6 dígitos. */
router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  try {
    const { usuario, code, newPassword } = req.body;
    const result = await resetPasswordWithCode({ login: usuario, code, newPassword });
    return res.json(result);
  } catch (err) {
    console.error('[auth/reset-password]', err);
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || 'No se pudo restablecer la contraseña'
    });
  }
});

router.post('/change-password', authRequired, validate(changePasswordSchema), async (req, res) => {
  try {
    const userId = req.user?.sub;
    const { oldPassword, newPassword } = req.body;

    if (!userId) return res.status(401).json({ message: 'No autorizado' });

    const ref = db.collection('usuarios').doc(String(userId));
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ message: 'Usuario no encontrado' });

    const data = doc.data();
    if (!data?.passwordHash) return res.status(400).json({ message: 'Usuario sin contraseña configurada' });

    const ok = await bcrypt.compare(String(oldPassword), data.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Contraseña actual incorrecta' });

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await ref.set(
      {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: Date.now()
      },
      { merge: true }
    );

    const id = Number(doc.id);
    const user = stripInternalFields({
      id: Number.isNaN(id) ? doc.id : id,
      usuario: data.usuario,
      email: data.email,
      rol: data.rol,
      ministerioId: data.ministerioId,
      mustChangePassword: false
    });
    const tokens = signTokenPair(user);
    return res.json({ token: tokens.token, refreshToken: tokens.refreshToken, user });
  } catch (err) {
    console.error('[auth/change-password]', err);
    return res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
});

module.exports = router;
