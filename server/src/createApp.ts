const express = require('express');
const compression = require('compression');

const { createCorsMiddleware } = require('./middleware/cors');
const { createHelmetMiddleware } = require('./middleware/helmet');
const { apiLimiter } = require('./middleware/rateLimit');
const { errorHandler } = require('./middleware/errorHandler');
const { authRequired, requireRoles, requirePasswordChanged, ROLES } = require('./middleware/auth');
const authRoutes = require('./routes/auth.routes');
const {
  ministeriosRouter,
  usuariosRouter,
  ingresosRouter,
  gastosRouter
} = require('./routes/crud.routes');
const notificacionesRouter = require('./routes/notificaciones.routes');
const bootstrapRouter = require('./routes/bootstrap.routes');
const adminRouter = require('./routes/admin.routes');
const cierresRouter = require('./routes/cierres.routes');
const pkg = require('../package.json');

/**
 * @param {{ useMemoryDb?: boolean }} [options]
 */
function createApp(options: { useMemoryDb?: boolean } = {}) {
  if (options.useMemoryDb) {
    process.env.IECA_USE_MEMORY_DB = 'true';
  }

  const useMemory = process.env.IECA_USE_MEMORY_DB === 'true';
  const { hasFirebaseCredentials } = require('./config/env');

  if (!useMemory && !hasFirebaseCredentials()) {
    throw new Error(
      '[FALTA] Firebase: coloca firebase-service-account.json en server/ o define FIREBASE_SERVICE_ACCOUNT_JSON.'
    );
  }

  require('./config/firebase');

  const app = express();
  app.set('trust proxy', 1);

  app.use(createHelmetMiddleware());
  app.use(compression());
  app.use(createCorsMiddleware());
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', async (_req, res) => {
    try {
      const { db } = require('./config/firebase');
      await db.collection('config').doc('sistema').get();
      const body: Record<string, unknown> = {
        ok: true,
        service: 'ieca-server',
        version: pkg.version,
        uptimeSeconds: Math.floor(process.uptime())
      };
      // smtpConfigured solo fuera de producción (no filtrar info en prod)
      if (process.env.NODE_ENV !== 'production') {
        const { smtpConfigured } = require('./config/env');
        body.smtpConfigured = Boolean(smtpConfigured);
      }
      res.json(body);
    } catch (err) {
      console.error('[health]', err);
      res.status(503).json({
        ok: false,
        service: 'ieca-server',
        message: 'Base de datos no disponible'
      });
    }
  });

  app.use('/api', apiLimiter);

  app.use((err, req, res, next) => {
    if (err?.message?.startsWith('CORS:')) {
      return res.status(403).json({ message: err.message });
    }
    return next(err);
  });

  app.use('/api/auth', authRoutes);
  // Bootstrap permitido aunque deba cambiar contraseña (carga mínima de sesión)
  app.use('/api/bootstrap', authRequired, bootstrapRouter);
  app.use('/api/ministerios', authRequired, requirePasswordChanged, requireRoles([ROLES.ADMIN]), ministeriosRouter);
  app.use('/api/usuarios', authRequired, requirePasswordChanged, requireRoles([ROLES.ADMIN]), usuariosRouter);
  app.use('/api/ingresos', authRequired, requirePasswordChanged, ingresosRouter);
  app.use('/api/gastos', authRequired, requirePasswordChanged, gastosRouter);
  app.use('/api/notificaciones', authRequired, requirePasswordChanged, notificacionesRouter);
  app.use('/api/cierres', authRequired, requirePasswordChanged, cierresRouter);
  app.use('/api/admin', authRequired, requirePasswordChanged, requireRoles([ROLES.ADMIN]), adminRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
