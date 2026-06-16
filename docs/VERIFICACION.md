# Verificación y pruebas — Gestión Financiera IECA

Resultados de la fase de pruebas (Fase 4 de la metodología). Fecha de ejecución documentada: **14–15 junio 2026**.

---

## Resumen ejecutivo

| Ámbito | Casos | Herramienta | Resultado |
|--------|-------|-------------|-----------|
| Frontend | 46 | Karma + Jasmine + ChromeHeadless | **46/46 SUCCESS** |
| Backend | 49 | Node.js test runner + Supertest | **48/49 pass** |
| **Total automatizado** | **95** | GitHub Actions (CI) | **94 pass + 1 condicional** |
| Manuales | 8 | Navegador escritorio | **CP-M01…CP-M08 verificados** |

El único fallo backend (`POST /api/admin/alertas/enviar`) ocurre cuando SMTP no está configurado en entorno local (respuesta 503 esperada). No afecta la lógica de negocio.

---

## Pruebas automatizadas — Frontend

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

---

## Pruebas automatizadas — Backend

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

\* En CI con credenciales SMTP de prueba el caso pasa; en local sin `SMTP_USER`/`SMTP_PASS` devuelve 503.

---

## Casos de prueba manuales

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

## Matriz requisito — prueba

| Requisito | Verificación |
|-----------|--------------|
| RF-04 Flujo de aprobación | CP-M02, CP-M03; colaborador crea pendiente; admin aprueba |
| RF-12 Aportación iglesia | CP-M03; `aportacion-iglesia.util.spec.ts` (8 casos) |
| RF-13 Bootstrap | CP-M08; `http.integration.test.js` |
| RF-08 Reportes / kardex | CP-M06, CP-M07; `reportes-filtros.util.spec.ts` |
| RF-09 Cierre mensual | CP-M05; `cierre-mensual.test.js` |
| RF-01 Auth | CP-M01; `auth.test.js` |
| RNF-01 Seguridad | Rate limit login; JWT; bcrypt |

---

## Integración continua

El workflow `.github/workflows/ci.yml` ejecuta en cada push y pull request:

- Frontend: `lint` → `test:ci` → `build:ci`
- Backend: `typecheck` → `build` → `npm test`

---

## Caso de implementación verificado

El flujo documentado en [IMPLEMENTACION.md](./IMPLEMENTACION.md) (ingreso #13, Andrés Quinde, saldo final **$41,94**) fue validado manualmente como parte de CP-M03 y CP-M07.
