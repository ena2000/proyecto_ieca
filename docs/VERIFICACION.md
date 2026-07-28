# Validación y verificación — Gestión Financiera IECA

Resultados de la fase de pruebas (Fase 4 de la metodología en cascada). Ejecución documentada: **17 julio 2026** (conteo actualizado respecto al snapshot de junio 2026).

Documentos relacionados: [CASOS-DE-USO.md](./CASOS-DE-USO.md) · [REQUERIMIENTOS.md](./REQUERIMIENTOS.md) · [IMPLEMENTACION.md](./IMPLEMENTACION.md)

---

## Tabla de contenidos

1. [Criterios de validación](#1-criterios-de-validación)
2. [Resultados del proyecto](#2-resultados-del-proyecto)
3. [Verificación técnica — pruebas automatizadas](#3-verificación-técnica--pruebas-automatizadas)
4. [Pruebas manuales de aceptación](#4-pruebas-manuales-de-aceptación)
5. [Integración continua y dataset demo](#5-integración-continua-y-dataset-demo)
6. [Trazabilidad requisito → caso de uso → prueba](#6-trazabilidad-requisito--caso-de-uso--prueba)

---

## 1. Criterios de validación

Para validar la propuesta tecnológica se utilizaron dos estrategias complementarias:

1. **Informe de pruebas** — verificación técnica (automatizada + manual).
2. **Pruebas de aceptación** — administrador, contable y colaboradores IECA.

### 1.1 Validación técnica

| Criterio | Estrategia | Resultado |
|----------|------------|-----------|
| Cumplimiento de RF | 188 casos automatizados + 8 manuales | 188 pass + 8 verificados |
| Reglas de negocio (33 %, cierre, roles) | Unitarias e integración | Superado |
| Seguridad (JWT, bcrypt, roles) | `auth.test.js` + manuales | Superado |
| Integración frontend–backend | Supertest + bootstrap | Superado |

### 1.2 Validación con usuarios institucionales

| ID | Criterio evaluado | Actor | Resultado |
|----|-------------------|-------|-----------|
| V-01 | Login y acceso por rol | Administrador, Contable, Colaborador | Cumple |
| V-02 | Registro de ingreso pendiente | Colaborador | Cumple |
| V-03 | Aprobación y aportación 33 % | Administrador | Cumple |
| V-04 | Consulta de reportes sin aprobar | Contable | Cumple |
| V-05 | Cierre mensual bloquea edición | Administrador | Cumple |
| V-06 | Exportación Excel con kardex | Administrador, Contable | Cumple |
| V-07 | Coherencia del kardex | Administrador | Cumple |
| V-08 | Carga de datos tras login (bootstrap) | Todos los roles | Cumple |

Los casos CP-M01 a CP-M08 (sección 4) respaldan V-01 a V-08.

### 1.3 Criterio de aceptación del prototipo

El prototipo se acepta por **verificación técnica** (184 pruebas automatizadas en CI) y **pruebas de aceptación** (CP-M01…CP-M08 / V-01…V-08), más la coherencia de la regla del 33 % en el caso documentado ([IMPLEMENTACION.md](./IMPLEMENTACION.md)).

---

## 2. Resultados del proyecto

| # | Resultado | Detalle |
|---|-----------|---------|
| R-1 | Sistema implementado y desplegado | Angular/Ionic + Node/Express + Firestore; Firebase Hosting + Render |
| R-2 | Pruebas automatizadas (jul 2026) | Frontend 118/118 · Backend 70/70 · Total 188/188 (100 %) |
| R-3 | Pruebas de aceptación | 8 casos manuales CP-M01…CP-M08 verificados |
| R-4 | Caso ingreso #13 | Andrés Quinde — $182 bruto — saldo kardex **$41,94** — [IMPLEMENTACION.md](./IMPLEMENTACION.md) |
| R-5 | Cronograma | 7 de 9 etapas completadas (análisis a pruebas) |
| R-6 | Entregables generados | Código, diagramas, 18 CU, informe de pruebas, `docs/`, `DEPLOY.md`, producción |

**Conclusión parcial:** el sistema cumple los objetivos de digitalizar la gestión financiera de IECA con reglas institucionales (aprobación, aportación 33 %, kardex) y evidencia verificable.

---

## 3. Verificación técnica — pruebas automatizadas

Ejecución documentada: **17 julio 2026** (suite ampliada respecto al snapshot de junio 2026).

### Resumen ejecutivo

| Ámbito | Casos | Herramienta | Resultado |
|--------|-------|-------------|-----------|
| Frontend | 118 | Karma + Jasmine + ChromeHeadless (`32` archivos `.spec.ts`) | **118/118 SUCCESS** |
| Backend | 70 | Node.js test runner + Supertest (`13` archivos `.test.js`) | **70/70 pass** |
| **Total automatizado** | **188** | GitHub Actions (CI) | **188/188 pass** |
| Manuales | 8 | Navegador escritorio | **CP-M01…CP-M08 verificados** |

### Frontend

Comando: `npm run test:ci`

| Archivo de prueba | Casos | Estado |
|-------------------|-------|--------|
| `aportacion-iglesia.util.spec.ts` | 9 | OK |
| `movimiento-validacion.util.spec.ts` | 10 | OK |
| `movimiento-fecha.util.spec.ts` | 8 | OK |
| `movimiento-filtros.util.spec.ts` | 8 | OK |
| `data.service.spec.ts` | 7 | OK |
| `reportes-filtros.util.spec.ts` | 7 | OK |
| `ministerio-nombre.util.spec.ts` | 6 | OK |
| `ministerios-catalogo.constants.spec.ts` | 5 | OK |
| `movimiento-form-sync.util.spec.ts` | 5 | OK |
| `movimiento-list-merge.util.spec.ts` | 5 | OK |
| `unicidad.util.spec.ts` | 5 | OK |
| `auth-token.storage.spec.ts` | 4 | OK |
| `entity-crud.util.spec.ts` | 4 | OK |
| `usuario-validacion.util.spec.ts` | 4 | OK |
| `ingresos.component.spec.ts` | 3 | OK |
| `jwt.util.spec.ts` | 3 | OK |
| `movimiento-estado.util.spec.ts` | 3 | OK |
| `movimiento-responsable.util.spec.ts` | 3 | OK |
| `app.component.spec.ts` | 2 | OK |
| `confirmacion-alerta.util.spec.ts` | 2 | OK |
| `http-mutation.util.spec.ts` | 2 | OK |
| `id-coerce.util.spec.ts` | 2 | OK |
| Componentes (login, gastos, reportes, admin, ministerios, usuarios, dashboard, slidebar, modal, tabla) | 10 | OK |
| **Total** | **118** | **SUCCESS** |

### Backend

Comando: `cd server && npm test`

| Archivo / suite | Casos | Estado |
|-----------------|-------|--------|
| `http.integration.test.js` | 14 | OK |
| `auth.test.js` (schema Zod, JWT, requireRoles) | 12 | OK |
| `security-rules.integration.test.js` | 11 | OK |
| `aportacion-constantes.test.js` | 2 | OK |
| `periodo.test.js` | 7 | OK |
| `env.production.test.js` | 6 | OK |
| `email-templates.test.js` | 4 | OK |
| `resumen-operativo.test.js` | 4 | OK |
| `cierre-mensual.test.js` | 3 | OK |
| `auditoria-csv.test.js` | 2 | OK |
| `liderazgo.test.js` | 2 | OK |
| `rate-limit.test.js` | 2 | OK |
| `unicidad.test.js` | 1 | OK |
| **Total** | **70** | **70 pass** |

---

## 4. Pruebas manuales de aceptación

| ID | Caso | Rol | Resultado esperado | Estado |
|----|------|-----|-------------------|--------|
| CP-M01 | Login con credenciales válidas | Administrador, Contable, Colaborador | Redirección a dashboard | Verificado |
| CP-M02 | Colaborador registra ingreso pendiente | Colaborador | Estado `pendiente`, no aparece en balance | Verificado |
| CP-M03 | Admin aprueba ingreso de talento | Administrador | Aportación 33 % a General; 67 % al ministerio | Verificado |
| CP-M04 | Contable consulta reportes sin aprobar | Contable | Solo lectura; sin botones aprobar/rechazar | Verificado |
| CP-M05 | Cierre mensual bloquea edición | Administrador | Movimientos del mes cerrado no editables | Verificado |
| CP-M06 | Exportar Excel con kardex | Administrador, Contable | Archivo `.xlsx` con resumen y kardex | Verificado |
| CP-M07 | Kardex coherente con movimientos | Administrador | Saldo = ingresos − gastos aprobados | Verificado |
| CP-M08 | Bootstrap tras login | Administrador, Contable, Colaborador | Una petición carga datos según rol | Verificado |

---

## 5. Integración continua y dataset demo

### CI

Workflow `.github/workflows/ci.yml` en cada push y PR:

- **Frontend:** `lint` → `test:ci` → `build:ci`
- **Backend:** `typecheck` → `build` → `npm test`

### Dataset demo (`backup-demo-ieca.json`)

| Recurso | Contenido |
|---------|-----------|
| Ministerios | 22 (lista IECA 2024 + General) |
| Usuarios | 182 demo (2 admin, 1 contable, 179 colaboradores); población de investigación N = 183 |
| Logins staff | `milena.mariscal`, `orbe.jimenez`, `diznarda.quezada` |
| Colaboradores | Formato `nombre.apellido` · contraseña `123456` |

---

## 6. Trazabilidad requisito → caso de uso → prueba

| Requisito | Casos de uso | Verificación |
|-----------|--------------|--------------|
| RF-01 Auth | CU-01, CU-02, CU-03 | CP-M01; `auth.test.js` |
| RF-02 / RF-03 Ingresos y gastos | CU-04, CU-05, CU-17, CU-18 | CP-M02; `movimiento-*.util.spec.ts` |
| RF-04 Flujo de aprobación | CU-04, CU-06, CU-07 | CP-M02, CP-M03; `security-rules.integration.test.js` |
| RF-05 / RF-06 / RF-14 Ministerios y usuarios | CU-10, CU-11 | `unicidad.util.spec.ts`; `unicidad.test.js` |
| RF-07 Dashboard | CU-08 | `data.service.spec.ts`; CP-M01 |
| RF-08 Reportes / kardex | CU-09 | CP-M06, CP-M07; `reportes-filtros.util.spec.ts` |
| RF-09 Cierre mensual | CU-12 | CP-M05; `cierre-mensual.test.js`; `periodo.test.js` |
| RF-10 Administración | CU-13, CU-14, CU-15 | `auditoria-csv.test.js`; alertas / backup (manual + integración) |
| RF-11 Notificaciones | CU-16 | Integración en sidebar; API notificaciones |
| RF-12 Aportación iglesia | CU-06 | CP-M03; `aportacion-iglesia.util.spec.ts`; security-rules |
| RF-13 Bootstrap | CU-01 | CP-M08; `http.integration.test.js` |
| RF-15 Fechas de movimiento | CU-04, CU-05 | `movimiento-fecha.util.spec.ts`; `movimiento-validacion.util.spec.ts` |
| RNF-01 Seguridad | CU-01 | JWT, bcrypt, rate limit; `env.production.test.js` |

---

*Proyecto privado — uso académico e institucional para IECA.*
