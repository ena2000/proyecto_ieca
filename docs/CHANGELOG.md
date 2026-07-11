# Historial de cambios — Gestión Financiera IECA

Registro resumido de entregas relevantes para el repositorio. Detalle técnico en [README.md](../README.md) y [METODOLOGIA.md](./METODOLOGIA.md).

---

## 2026-07 — Plan Render Starter en producción

- API `ieca-api` en plan **Starter** (pago, siempre activo; `render.yaml`).
- Documentación (README, DEPLOY, RNF-04, PROPUESTA, METODOLOGIA) alineada: ya no se documenta cold start como escenario de producción.
- Workflow `keep-render-warm.yml`: cron desactivado (solo `workflow_dispatch` por si se baja de plan).

---

## 2026-06 — Secciones de tesis validadas (Beneficiarios, Entregables, Propuesta)

### Documentación

- **BENEFICIARIOS.md** — prosa narrativa validada (directos e indirectos).
- **ENTREGABLES-Y-PROPUESTA.md** — EDT Tabla 30 y propuesta (3 capas, 4 módulos).
- **CRITERIOS-VALIDACION-Y-RESULTADOS.md** — criterios V-01…V-08 y 6 resultados.
- **TESIS-CONSOLIDADO.md** — índice maestro de todo el contenido validado.
- Scripts Word: `actualizar-capitulo3-secciones-finales-word.py`, `beneficiarios-contenido.py`, `entregables-propuesta-contenido.py`.
- Contenido aplicado en `CAPITULO 3 - ENTENDERLO.docx`.

---

### Documentación

- Toda la documentación de tesis centralizada en **`docs/`**: casos de uso (18 CU / 4 módulos), requisitos, implementación, verificación, entregables académicos.
- Diagramas UML y cronograma copiados a **`docs/diagramas/`** (PNG + `cronograma-ieca.gan`).
- Índice en **`docs/README.md`**; metodología y README del repo actualizados con enlaces cruzados.
- Caso de implementación validado: Andrés Quinde, ingreso #13, saldo kardex **$41,94**.
- Scripts Python en `docs/scripts/` para actualizar documentos Word de titulación.

---

## 2026-06 — Rendimiento, roles y validaciones

### Backend

- **`GET /api/bootstrap`:** carga inicial agregada por rol (ingresos, gastos, ministerios, usuarios admin, notificaciones) con caché en servidor (`bootstrapCache.ts`, TTL 60 s).
- **`GET /api/cierres/estado`:** lectura de periodos cerrados para todos los roles autenticados (antes solo vía `/admin/config`).
- **`GET /api/health` ampliado:** incluye `version`, `uptimeSeconds` y `smtpConfigured`.
- **Compresión HTTP:** middleware `compression` en Express.
- **Unicidad:** utilidad `server/src/utils/unicidad.ts` y tests.

### Frontend

- **`DataService.bootstrapRemote`:** una petición tras login; caché en memoria (5 min) y `sessionStorage` (10 min).
- **`CierreService`:** consume `/api/cierres/estado` en producción.
- **`api-wake.util.ts`:** despierta el API en login y recuperación de contraseña (cold start Render).
- **Rol `Colaborador`:** reemplaza `Lider/CoLider` como valor en Firestore (legacy aún aceptado). Ministerio opcional al crear colaborador.
- **Ministerios:** columna **Colaboradores** derivada de usuarios; ya no se asignan líder/co-líder en el formulario de ministerio.
- **`unicidad.util.ts`:** validación client-side de nombres de ministerio y emails duplicados.
- **`movimiento-responsable.util.ts`:** asigna `usuarioId` y `registradoPor` en altas de ingresos/gastos.
- **`notificacion-filtro.util.ts`:** filtrado de notificaciones por rol y audiencia.

### DevOps

- **`.github/workflows/keep-render-warm.yml`:** ping a `/api/health` cada 10 min (plan Free Render).
- Scripts nuevos en `server/`: `usuario:inicial`, `seed:random`, `email:prueba`, `render:setup`.
- `npm run start:render` en frontend (proxy a API en Render).

### Pruebas

- Frontend: **46** casos en **19** archivos `.spec.ts`.
- Backend: **49** casos en **9** archivos `.test.js`.
- **Total: 95** (CI en GitHub Actions).

### Documentación

- README, DEPLOY, METODOLOGIA y CHANGELOG actualizados con bootstrap, Colaborador, cold start y conteos de prueba.

---

## 2026-06 — Vista estrecha y correcciones móvil web

### Frontend (solo requiere `npm run deploy:hosting`)

- **Menú ☰:** nuevo `ToolbarMenuButtonComponent` reemplaza `ion-menu-button` (no funcionaba sin `ion-menu` de Ionic) en dashboard, ingresos, gastos, reportes, ministerios, usuarios y administración.
- **Sidebar móvil:** `SidebarUiService` + sidebar off-canvas + backdrop; escritorio sin cambios (`min-width: 769px`).
- **Estilos estrechos:** `src/theme/_mobile-narrow.scss` — tablas con scroll horizontal, toolbars, modales y botones adaptados.
- **Login:** tarjeta centrada verticalmente en vista estrecha (`login.component.scss`, `100dvh`).

### Documentación

- README, DEPLOY y METODOLOGIA actualizados con plataforma de uso, despliegue parcial y verificación en vista estrecha.

---

## 2026-06 — Aportación iglesia 33% (talento)

### Regla de negocio

- Solo ingresos de cuenta **4105** («Talento y eventos») con **ministerio asignado** (no `General`).
- Al **aprobar** (o crear ya aprobado como admin): ingreso automático del **33%** en ministerio `General`; el ministerio conserva el **67%** en saldo, kardex y KPIs.
- Movimientos automáticos **no editables/borrables**; al eliminar el ingreso origen se elimina el ingreso de iglesia vinculado.

### Código

| Ámbito | Archivos principales |
|--------|----------------------|
| Backend | `server/src/constants/aportacion-iglesia.ts`, `server/src/utils/aportacion-iglesia.ts`, hooks en `server/src/utils/ingresos.ts` |
| Frontend | `aportacion-iglesia.constants.ts`, `aportacion-iglesia.util.ts`, `ingresos.service.ts`, `data.service.ts` |
| UI admin | Tabla aportación en **Administración**; columnas en **Reportes** (solo administrador) |
| Tests | `aportacion-iglesia.util.spec.ts` |

### Despliegue

- Cambios en `server/` → push a Render.
- Cambios en `src/` → `npm run deploy:hosting`.
- Ambos si se modificaron API y panel.

---

## Referencia de despliegue

| Componente | Plataforma | Comando / flujo |
|------------|------------|-----------------|
| Frontend | Firebase Hosting | `npm run deploy:hosting` |
| API | Render | Push a rama conectada (auto-deploy) |
| API (plan Starter) | Render | Siempre activo; blueprint `render.yaml` |

Ver [DEPLOY.md](./DEPLOY.md) para checklist completo.
