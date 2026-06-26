const express = require('express');
const compression = require('compression');

const { createCorsMiddleware } = require('./middleware/cors');
const { createHelmetMiddleware } = require('./middleware/helmet');
const { apiLimiter } = require('./middleware/rateLimit');
const { errorHandler } = require('./middleware/errorHandler');
const { authRequired, requireRoles, ROLES } = require('./middleware/auth');
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

  app.get('/api/health', (_req, res) => {
    const { smtpConfigured, brevoConfigured, emailConfigured } = require('./config/env');
    res.json({
      ok: true,
      service: 'ieca-server',
      version: pkg.version,
      uptimeSeconds: Math.floor(process.uptime()),
      smtpConfigured: Boolean(smtpConfigured),
      brevoConfigured: Boolean(brevoConfigured),
      emailConfigured: Boolean(emailConfigured)
    });
  });

  app.use('/api', apiLimiter);

  app.use((err, req, res, next) => {
    if (err?.message?.startsWith('CORS:')) {
      return res.status(403).json({ message: err.message });
    }
    return next(err);
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/bootstrap', authRequired, bootstrapRouter);
  app.use('/api/ministerios', authRequired, requireRoles([ROLES.ADMIN]), ministeriosRouter);
  app.use('/api/usuarios', authRequired, requireRoles([ROLES.ADMIN]), usuariosRouter);
  app.use('/api/ingresos', authRequired, ingresosRouter);
  app.use('/api/gastos', authRequired, gastosRouter);
  app.use('/api/notificaciones', authRequired, notificacionesRouter);
  app.use('/api/cierres', authRequired, cierresRouter);
  app.use('/api/admin', authRequired, requireRoles([ROLES.ADMIN]), adminRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
