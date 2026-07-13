# Requisitos del sistema — Gestión Financiera IECA

Especificación de requisitos validada con stakeholders de IECA (administrador y contable). Complementa la Fase 1 descrita en [METODOLOGIA.md](./METODOLOGIA.md).

---

## Actores

| Actor | Descripción |
|-------|-------------|
| **Administrador** | Acceso total: usuarios, ministerios, aprobación/rechazo de movimientos, cierre, backup, auditoría. |
| **Contable** | Consulta ingresos/gastos y reportes; recibe alertas por correo; no aprueba movimientos ni gestiona usuarios/ministerios. |
| **Colaborador** | Registra ingresos/gastos de su ministerio (si tiene `ministerioId`) en estado pendiente. |

---

## Requisitos funcionales

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RF-01 | Autenticación | Login con JWT, recuperación de contraseña, cambio obligatorio en primer acceso. |
| RF-02 | Gestión de ingresos | CRUD, comprobantes, filtros, estados pendiente/aprobado/rechazado; aprobación/rechazo solo administrador. |
| RF-03 | Gestión de gastos | CRUD, categorías, comprobantes; aprobación/rechazo solo administrador. |
| RF-04 | Flujo de aprobación | Colaborador crea pendiente; solo el administrador aprueba o rechaza. |
| RF-05 | Ministerios | CRUD de departamentos; colaboradores asignados vía usuarios con `ministerioId` (solo admin). |
| RF-06 | Usuarios | CRUD con roles, contraseña temporal en alta. |
| RF-07 | Dashboard | KPIs, gráficos y últimos movimientos (solo aprobados). |
| RF-08 | Reportes | Filtros por período, ministerio y tipo; resumen del período; desglose por ministerio (saldo disponible histórico, aportación período/acum. para admin) y por cuenta; kardex por ministerio; exportación Excel. |
| RF-09 | Cierre mensual | Bloqueo de periodos; movimientos del mes marcados como cerrados. |
| RF-10 | Administración | Backup/restauración JSON, auditoría CSV, alertas por email, resumen de aportación iglesia por ministerio. |
| RF-11 | Notificaciones | Alertas de pendientes y eventos del sistema por usuario. |
| RF-12 | Aportación iglesia | Al aprobar ingreso de talento (cuenta `4105`) con ministerio: 33 % automático a `General`; ministerio retiene 67 %; movimiento automático no editable. |
| RF-13 | Carga inicial (bootstrap) | `GET /api/bootstrap` agrega datos por rol en una petición; caché servidor y cliente. |
| RF-14 | Unicidad | Nombres de ministerio y emails sin duplicados (tildes/mayúsculas; equivalentes «ministerio de Alabanza» ≈ «Alabanza»). |
| RF-15 | Fechas de movimiento | Ingresos/gastos: la fecha no puede ser posterior a hoy; periodos cerrados no admiten altas ni cambios. |

---

## Requisitos no funcionales

| ID | Requisito | Criterio |
|----|-----------|----------|
| RNF-01 | Seguridad | Contraseñas con bcrypt; JWT access/refresh; Helmet; rate limiting. |
| RNF-02 | Validación | Esquemas Zod en API; guards e interceptors en frontend. |
| RNF-03 | Usabilidad | Interfaz de escritorio en navegador; sidebar fijo; toasts consistentes; vista estrecha (≤768 px) con menú ☰. |
| RNF-04 | Disponibilidad | API en Render (plan **Starter**, siempre activo); frontend en Firebase Hosting. |
| RNF-05 | Mantenibilidad | Código modular por capas; utilidades puras testeables. |
| RNF-06 | Trazabilidad | Auditoría de login y movimientos; exportación CSV. |

---

## Reglas de negocio clave

- Solo los movimientos en estado **aprobado** cuentan en balance, gráficos, reportes consolidados, **kardex** y **saldo disponible**.
- Los **colaboradores** registran en `pendiente`; **solo el administrador** aprueba o rechaza.
- El **contable** consulta movimientos y reportes y recibe alertas por correo, pero **no** ejecuta aprobaciones.
- Los totales **del período** en Reportes respetan el filtro de mes, ministerio y tipo; el **saldo disponible** y el **kardex** son **históricos** (todos los aprobados del ministerio, sin filtro de mes).
- Los **periodos cerrados** impiden altas, ediciones y borrados en ese mes.
- La **fecha del movimiento** no puede ser futura (máximo el día de hoy); meses abiertos del pasado sí se permiten hasta el cierre.
- Los **colaboradores** solo ven y operan sobre su `ministerioId` (cuando está asignado).
- El rol en Firestore es **`Colaborador`**; el valor legacy `Lider/CoLider` sigue aceptándose en login y API.
- La **aportación iglesia (33 %)** aplica solo a ingresos de cuenta **4105** (talento) con ministerio asignado; genera un ingreso en `General` al aprobar; al borrar el origen se elimina el ingreso vinculado.
- El **kardex** se calcula en el cliente (`DataService.getKardexMinisterio`); la UI muestra el más reciente arriba (`.reverse()`).

---

## Alcance

### Incluido

- Panel web de escritorio para administración financiera por ministerio.
- Flujo de aprobación, reportes, kardex, cierre mensual, backup y alertas.
- Despliegue en Firebase Hosting + Render.

### Excluido

- App móvil nativa (Android/iOS).
- Integración bancaria o facturación electrónica.
- Contabilidad de partida doble completa.

---

## Casos de uso

Los 18 casos de uso que cubren estos requisitos están en [CASOS-DE-USO.md](./CASOS-DE-USO.md).
