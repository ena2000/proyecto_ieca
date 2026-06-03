# Despliegue — Gestión Financiera IECA

Guía para publicar el frontend (Angular/Ionic) y la API (Node.js + TypeScript) en **producción real**.

### Plataforma de uso

| Ámbito | Estado |
|--------|--------|
| **Web (navegador)** | Uso previsto y despliegue actual: la aplicación se opera desde el **navegador en escritorio** (hosting estático + API). |
| **Móvil** | **Implementación futura** — no está previsto desplegar ni dar soporte oficial en teléfono en esta fase. |

A nivel técnico, el frontend **ya está orientado a móvil**: **Ionic 8**, estilos **responsive**, metaetiquetas en `index.html` para pantallas pequeñas y **Capacitor 8** en el proyecto (`capacitor.config.ts`). Eso facilitará una fase posterior (PWA, navegador móvil o app nativa), pero **esta guía y los flujos de release cubren solo web**: no hay proyectos Android/iOS generados ni builds móviles documentados aquí.

---

## Checklist obligatorio

Marca cada ítem antes de abrir el sistema a usuarios reales:

- [ ] `NODE_ENV=production` en el servidor
- [ ] `JWT_SECRET` aleatorio (≥ 32 caracteres, no de ejemplo)
- [ ] `CORS_ORIGINS` con la URL **HTTPS** exacta del frontend
- [ ] `firebase-service-account.json` en `server/` (nunca en Git)
- [ ] `npm run build` ejecutado → existe `server/dist/`
- [ ] `npm run verify:prod` sin errores (con `NODE_ENV=production`)
- [ ] `environment.prod.ts` → `apiUrl` apunta al dominio del API
- [ ] `useLocalFallback: false` en producción (ya configurado en build)
- [ ] Contraseñas del seed (`123456`) cambiadas por todos los usuarios
- [ ] SMTP configurado si usas recuperación de contraseña o alertas por email
- [ ] HTTPS activo en frontend y API (certificado TLS)

---

## Artefactos automáticos (GitHub Actions)

Workflow [`.github/workflows/release.yml`](../.github/workflows/release.yml):

| Artefacto | Contenido |
|-----------|-----------|
| `ieca-frontend-www` | Carpeta `www/` (sitio estático) |
| `ieca-server` | API compilada (`dist/`) + `node_modules` producción |

Descarga: GitHub → **Actions** → **Release build** → **Artifacts**.

---

## Frontend (carpeta `www/`)

### Build local

```bash
npm ci
npm run build:ci
# Salida: www/
```

Edita `src/environments/environment.prod.ts` **antes** del build:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.tu-dominio.org/api',
  useLocalFallback: false
};
```

### Firebase Hosting

```bash
firebase init hosting   # public directory: www
npm run build:ci
firebase deploy --only hosting
```

Configura rewrites SPA: `**` → `/index.html`.

### Nginx (frontend + proxy API)

```nginx
server {
  listen 443 ssl http2;
  server_name app.tu-dominio.org;
  root /var/www/ieca/www;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}

server {
  listen 443 ssl http2;
  server_name api.tu-dominio.org;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## Backend (API TypeScript)

### 1. Variables (`server/.env`)

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<genera-con-node-crypto>
CORS_ORIGINS=https://app.tu-dominio.org
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# SMTP (recomendado)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

Generar secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Credenciales Firebase

Coloca `firebase-service-account.json` en `server/` (mismo nivel que `package.json`).

### 3. Compilar y verificar

```bash
cd server
npm ci
npm run build
set NODE_ENV=production   # Linux/macOS: export NODE_ENV=production
npm run verify:prod
npm start
```

El servidor **no arranca** en producción si:

- Falta `CORS_ORIGINS` o es solo localhost
- Falta `firebase-service-account.json`
- `DEV_RESET_CODE_IN_RESPONSE=true`
- `IECA_USE_MEMORY_DB=true`

### 4. PM2 (VPS recomendado)

```bash
cd /opt/ieca/server
npm ci
npm run build
# Coloca .env y firebase-service-account.json
mkdir -p logs
set NODE_ENV=production
npm run verify:prod
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Archivo incluido: [`server/ecosystem.config.cjs`](../server/ecosystem.config.cjs).

### 5. Railway / Render

| Campo | Valor |
|-------|-------|
| Root directory | `server` |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Health check | `GET /api/health` |

Variables de entorno: las de `.env` arriba. Sube `firebase-service-account.json` como secret file o variable base64.

---

## Verificación post-despliegue

```bash
# Health (incluye versión y uptime)
curl https://api.tu-dominio.org/api/health

# Login
curl -X POST https://api.tu-dominio.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"***"}'
```

En el navegador:

1. Abre el frontend por HTTPS
2. Inicia sesión
3. Comprueba dashboard, ingreso, aprobación (contable) y reportes
4. Admin: verifica panel de administración y backup

---

## Actualizar versión desplegada

```bash
# Frontend
npm run build:ci
# Sustituir www/ en hosting

# Backend
cd server
git pull
npm ci
npm run build
npm run verify:prod
pm2 restart ieca-api
```

---

## Solución de problemas

| Síntoma | Acción |
|---------|--------|
| `npm start` falla en verify | Ejecuta `npm run build`; revisa `.env` y Firebase JSON |
| CORS en navegador | Origen exacto (con `https://`) en `CORS_ORIGINS` |
| 401 en todo el API | Unifica `JWT_SECRET`; verifica `passwordHash` en Firestore |
| 500 genérico en prod | Normal — detalles solo en logs del servidor |
| Pantalla en blanco | Rewrite SPA a `index.html` |
| API no arranca | Logs: `[PRODUCCIÓN]` indica qué falta en `.env` |

Más detalle: [README principal](../README.md).
