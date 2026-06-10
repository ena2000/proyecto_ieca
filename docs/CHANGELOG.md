# Historial de cambios — Gestión Financiera IECA

Registro resumido de entregas relevantes para el repositorio. Detalle técnico en [README.md](../README.md) y [METODOLOGIA.md](./METODOLOGIA.md).

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

Ver [DEPLOY.md](./DEPLOY.md) para checklist completo.
