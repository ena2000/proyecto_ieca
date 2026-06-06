# Despliegue — Gestión Financiera IECA

Guía para publicar el frontend (Angular/Ionic) y la API (Node.js + TypeScript) en **producción real**.

| Componente | Plataforma recomendada |
|------------|------------------------|
| **Frontend** (`www/`) | Firebase Hosting |
| **Backend** (API) | **Render** (Web Service) |

### Plataforma de uso

| Ámbito | Estado |
|--------|--------|
| **Web (navegador)** | Uso previsto y despliegue actual: la aplicación se opera desde el **navegador en escritorio** (hosting estático + API). |
| **Móvil** | **Implementación futura** — no está previsto desplegar ni dar soporte oficial en teléfono en esta fase. |

A nivel técnico, el frontend **ya está orientado a móvil**: **Ionic 8**, estilos **responsive**, metaetiquetas en `index.html` para pantallas pequeñas y **Capacitor 8** en el proyecto (`capacitor.config.ts`). Eso facilitará una fase posterior (PWA, navegador móvil o app nativa), pero **esta guía y los flujos de release cubren solo web**: no hay proyectos Android/iOS generados ni builds móviles documentados aquí.

---

## Checklist obligatorio

Marca cada ítem antes de abrir el sistema a usuarios reales:

- [ ] `NODE_ENV=production` en Render
- [ ] `JWT_SECRET` aleatorio (≥ 32 caracteres, no de ejemplo)
- [ ] `CORS_ORIGINS` con la URL **HTTPS** exacta del frontend (Firebase Hosting)
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` configurado en Render (o archivo local en desarrollo)
- [ ] `npm run build` ejecutado → existe `server/dist/`
- [ ] `npm run verify:prod` sin errores (con `NODE_ENV=production`)
- [ ] `environment.prod.ts` → `apiUrl` apunta a la URL del API en Render
- [ ] `useLocalFallback: false` en producción (ya configurado en build)
- [ ] Contraseñas del seed (`123456`) cambiadas por todos los usuarios
- [ ] SMTP configurado si usas recuperación de contraseña o alertas por email
- [ ] HTTPS activo en frontend y API (Render y Firebase lo proveen)

---

## Artefactos automáticos (GitHub Actions)

Workflow [`.github/workflows/release.yml`](../.github/workflows/release.yml):

| Artefacto | Contenido |
|-----------|-----------|
| `ieca-frontend-www` | Carpeta `www/` (sitio estático) |
| `ieca-server` | API compilada (`dist/`) + `node_modules` producción |

Descarga: GitHub → **Actions** → **Release build** → **Artifacts**.

> En Render normalmente **no necesitas** el artefacto del servidor: Render compila desde el repositorio conectado a GitHub.

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
  // URL de tu Web Service en Render (o dominio personalizado)
  apiUrl: 'https://ieca-api.onrender.com/api',
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

---

## Backend en Render (recomendado)

### 1. Crear el Web Service

1. [render.com](https://render.com) → **New** → **Web Service**.
2. Conecta el repositorio de GitHub.
3. Configuración:

| Campo | Valor |
|-------|-------|
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm ci --include=dev && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |

También puedes usar el blueprint incluido: [`render.yaml`](../render.yaml) → **New** → **Blueprint**.

### 2. Plan y disponibilidad

| Plan | Comportamiento |
|------|----------------|
| **Free** | El servicio **se duerme** tras inactividad; la primera petición puede tardar ~30–60 s (cold start). |
| **Starter** (recomendado) | Siempre activo, sin cold start. Adecuado para uso real de la iglesia. |

### 3. Variables de entorno en Render

En el panel del servicio → **Environment**:

| Variable | Obligatoria | Ejemplo / notas |
|----------|-------------|-----------------|
| `NODE_ENV` | Sí | `production` (si el build falla con `tsc not found`, usa el Build Command con `--include=dev` abajo) |
| `JWT_SECRET` | Sí | Genera con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CORS_ORIGINS` | Sí | `https://tu-proyecto.web.app` o dominio Firebase custom |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Sí | Contenido **completo** del JSON de Firebase (una sola línea) |
| `JWT_ACCESS_EXPIRES` | No | `15m` (por defecto) |
| `JWT_REFRESH_EXPIRES` | No | `7d` (por defecto) |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Recomendado | Para recuperación de contraseña y alertas |
| `ALERTAS_CRON_ENABLED` | No | `true` si quieres cron de alertas en el mismo proceso |

Render asigna `PORT` automáticamente; no lo configures manualmente.

#### Firebase en Render (sin archivo en disco)

Copia el contenido de `firebase-service-account.json` como valor de `FIREBASE_SERVICE_ACCOUNT_JSON`:

```bash
# Linux / macOS — pega el resultado en Render
node -e "console.log(JSON.stringify(require('./server/firebase-service-account.json')))"
```

En Windows (PowerShell):

```powershell
Get-Content server\firebase-service-account.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress
```

> **Nunca** subas el JSON a Git. Usa solo variables secretas en Render.

### 4. Dominio personalizado (opcional)

Si quieres `https://api.ieca-alborada.org` en lugar de `*.onrender.com`:

1. Render → tu servicio → **Settings** → **Custom Domains**.
2. Añade el subdominio y configura el CNAME que indique Render.
3. Actualiza `CORS_ORIGINS` y `environment.prod.ts` con las URLs finales.

### 5. Despliegue automático

Con el repo conectado, cada push a `main`/`master` dispara un nuevo deploy en Render (si **Auto-Deploy** está activo).

Flujo manual de verificación local antes del primer deploy:

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
- Falta Firebase (`FIREBASE_SERVICE_ACCOUNT_JSON` o archivo local)
- `DEV_RESET_CODE_IN_RESPONSE=true`
- `IECA_USE_MEMORY_DB=true`

---

## Alternativa: VPS con PM2

Si más adelante migras a un VPS propio (no es el flujo principal):

```bash
cd /opt/ieca/server
npm ci
npm run build
# Coloca .env y firebase-service-account.json
mkdir -p logs
export NODE_ENV=production
npm run verify:prod
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Archivo incluido: [`server/ecosystem.config.cjs`](../server/ecosystem.config.cjs).

---

## Verificación post-despliegue

```bash
# Health (incluye versión y uptime)
curl https://ieca-api.onrender.com/api/health

# Login
curl -X POST https://ieca-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"***"}'
```

En el navegador:

1. Abre el frontend por HTTPS (Firebase Hosting)
2. Inicia sesión
3. Comprueba dashboard, ingreso, aprobación (**administrador**) y reportes
4. Admin: verifica panel de administración y backup

---

## Actualizar versión desplegada

**Frontend**

```bash
npm run build:ci
firebase deploy --only hosting
```

**Backend (Render)**

- Push a la rama conectada → deploy automático, o
- Render → **Manual Deploy** → **Deploy latest commit**

---

## Solución de problemas

| Síntoma | Acción |
|---------|--------|
| Primera carga muy lenta | Plan Free en Render: cold start; sube a Starter o espera |
| Deploy falla en build | Revisa logs; ejecuta `npm run build` en local |
| `verify:prod` falla | Revisa variables en Render; Firebase JSON en una sola línea |
| CORS en navegador | Origen exacto (con `https://`) en `CORS_ORIGINS` |
| 401 en todo el API | Unifica `JWT_SECRET`; verifica `passwordHash` en Firestore |
| 500 genérico en prod | Normal — detalles solo en logs de Render |
| Pantalla en blanco | Rewrite SPA a `index.html` en Firebase Hosting |
| API no arranca | Logs en Render: `[PRODUCCIÓN]` indica qué falta |

Más detalle: [README principal](../README.md).
