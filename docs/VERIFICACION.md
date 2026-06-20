# Validación y verificación — Gestión Financiera IECA

Resultados de la fase de pruebas (Fase 4 de la metodología en cascada). Ejecución documentada: **14–15 junio 2026**.

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
| Cumplimiento de RF | 95 casos automatizados + 8 manuales | 94 pass + 8 verificados |
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

### 1.3 Marco académico — Juicio de expertos (referencia)

Selección de 12–15 expertos, Método Delphi, concordancia de Kendall y Chi-cuadrado (p ≤ 0,05). Criterios sugeridos: cumplimiento de requisitos, arquitectura, reglas de negocio, usabilidad en escritorio, viabilidad institucional (escala 1–5).

---

## 2. Resultados del proyecto

| # | Resultado | Detalle |
|---|-----------|---------|
| R-1 | Sistema implementado y desplegado | Angular/Ionic + Node/Express + Firestore; Firebase Hosting + Render |
| R-2 | Pruebas automatizadas (jun 2026) | Frontend 46/46 · Backend 48/49 · Total 94/95 (98,95 %) |
| R-3 | Pruebas de aceptación | 8 casos manuales CP-M01…CP-M08 verificados |
| R-4 | Caso ingreso #13 | Andrés Quinde — $182 bruto — saldo kardex **$41,94** — [IMPLEMENTACION.md](./IMPLEMENTACION.md) |
| R-5 | Cronograma | 7 de 9 etapas completadas (análisis a pruebas) |
| R-6 | Entregables generados | Código, diagramas, 18 CU, informe de pruebas, `docs/`, `DEPLOY.md`, producción |

**Conclusión parcial:** el sistema cumple los objetivos de digitalizar la gestión financiera de IECA con reglas institucionales (aprobación, aportación 33 %, kardex) y evidencia verificable.

---

## 3. Verificación técnica — pruebas automatizadas

### Resumen ejecutivo

| Ámbito | Casos | Herramienta | Resultado |
|--------|-------|-------------|-----------|
| Frontend | 46 | Karma + Jasmine + ChromeHeadless | **46/46 SUCCESS** |
| Backend | 49 | Node.js test runner + Supertest | **48/49 pass** |
| **Total automatizado** | **95** | GitHub Actions (CI) | **94 pass + 1 condicional** |
| Manuales | 8 | Navegador escritorio | **CP-M01…CP-M08 verificados** |

El único fallo backend (`POST /api/admin/alertas/enviar`) ocurre sin SMTP en local (503). No afecta la lógica de negocio.

### Frontend

Comando: `npm run test:ci`

| Archivo de prueba | Casos | Estado |
|-------------------|-------|--------|
| `aportacion-iglesia.util.spec.ts` | 8 | OK |
| `movimiento-filtros.util.spec.ts` | 6 | OK |
| `movimiento-responsable.util.spec.ts` | 4 | OK |
| `reportes-filtros.util.spec.ts` | 5 | OK |
| `unicidad.util.spec.ts` | 3 | OK |
| `contabilidad-cuenta-form.util.spec.ts` | 4 | OK |
| `ingreso.util.spec.ts` | 3 | OK |
| `data.service.spec.ts` | 4 | OK |
| Componentes (login, ingresos, gastos, reportes, admin, …) | 9 | OK |
| **Total** | **46** | **SUCCESS** |

### Backend

Comando: `cd server && npm test`

| Suite | Casos | Estado |
|-------|-------|--------|
| `auth.schema` (Zod) | 4 | OK |
| `signToken / JWT` | 4 | OK |
| `requireRoles` | 2 | OK |
| `cierre-mensual` | 3 | OK |
| `email-templates` | 4 | OK |
| `getProductionConfigErrors` | 6 | OK |
| `API HTTP (integración)` | 12 | 11 OK, 1 fallo SMTP* |
| `colaboradores de ministerio` | 2 | OK |
| `labelToPeriodoKey / fechaToPeriodoKey` | 3 | OK |
| `etiquetaParaMes` | 1 | OK |
| `entityBloqueadoPorCierre` | 3 | OK |
| `resumen-operativo` | 4 | OK |
| `unicidad` | 1 | OK |
| **Total** | **49** | **48 pass** |

\* En CI con credenciales SMTP el caso pasa; en local sin `SMTP_USER`/`SMTP_PASS` devuelve 503.

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
| Usuarios | 182 (2 admin, 1 contable, 179 colaboradores) |
| Logins staff | `milena.mariscal`, `orbe.jimenez`, `diznarda.quezada` |
| Colaboradores | Formato `nombre.apellido` · contraseña `123456` |
| Regenerar | `python docs/scripts/generar-backup-demo-colaboradores.py` |

---

## 6. Trazabilidad requisito → caso de uso → prueba

| Requisito | Casos de uso | Verificación |
|-----------|--------------|--------------|
| RF-01 Auth | CU-01, CU-02, CU-03 | CP-M01; `auth.test.js` |
| RF-04 Flujo de aprobación | CU-04, CU-06, CU-07 | CP-M02, CP-M03 |
| RF-08 Reportes / kardex | CU-09 | CP-M06, CP-M07; `reportes-filtros.util.spec.ts` |
| RF-09 Cierre mensual | CU-12 | CP-M05; `cierre-mensual.test.js` |
| RF-12 Aportación iglesia | CU-06 | CP-M03; `aportacion-iglesia.util.spec.ts` |
| RF-13 Bootstrap | CU-01 | CP-M08; `http.integration.test.js` |
| RNF-01 Seguridad | CU-01 | JWT, bcrypt, rate limit |

---

*Proyecto privado — uso académico e institucional para IECA.*
