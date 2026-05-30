/**
 * PM2 — Gestión Financiera IECA API
 *
 * Uso:
 *   cd server
 *   npm run build
 *   npm run verify:prod   # NODE_ENV=production
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'ieca-api',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10_000,
      kill_timeout: 10_000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
