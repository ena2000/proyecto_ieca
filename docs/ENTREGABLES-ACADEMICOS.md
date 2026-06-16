# Entregables académicos — Gestión Financiera IECA

Secciones complementarias para el documento de titulación: beneficiarios, entregables, propuesta, criterios de validación y resultados.

---

## Beneficiarios

### Beneficiarios directos

| Beneficiario | Beneficio |
|--------------|-----------|
| **Administración de IECA** | Control centralizado de ingresos, gastos y aprobaciones por ministerio |
| **Contadores / tesoreros** | Reportes, kardex, exportación Excel y alertas operativas |
| **Colaboradores de ministerio** | Registro digital de movimientos con comprobantes y trazabilidad |
| **Liderazgo pastoral** | Visibilidad del balance y aportación iglesia (33 % talento) |

### Beneficiarios indirectos

| Beneficiario | Beneficio |
|--------------|-----------|
| **Comunidad de la iglesia** | Mayor transparencia en el uso de recursos ministeriales |
| **Auditores internos** | Historial exportable (CSV, JSON) y auditoría de login |
| **Futuros desarrolladores** | Código documentado, pruebas automatizadas y metodología trazable |

---

## Entregables del proyecto

| # | Entregable | Ubicación |
|---|------------|-----------|
| 1 | Especificación de requisitos (18 CU, RF, RNF) | [REQUERIMIENTOS.md](./REQUERIMIENTOS.md), [CASOS-DE-USO.md](./CASOS-DE-USO.md) |
| 2 | Documento de diseño (arquitectura, BD, diagramas) | [diagramas/](./diagramas/), [METODOLOGIA.md](./METODOLOGIA.md) §4 |
| 3 | Código fuente (frontend + API) | `src/`, `server/src/` |
| 4 | Informe de pruebas | [VERIFICACION.md](./VERIFICACION.md) |
| 5 | Caso de implementación documentado | [IMPLEMENTACION.md](./IMPLEMENTACION.md) |
| 6 | Sistema desplegado | Firebase Hosting + Render — [DEPLOY.md](./DEPLOY.md) |
| 7 | Dataset de demostración | [backup-demo-ieca.json](./backup-demo-ieca.json) |
| 8 | Documento de tesis (Word) | Fuera del repositorio (`TITULACION/`) |

---

## Propuesta de solución

Se propone un **sistema web de gestión financiera** orientado a escritorio que:

1. Centraliza ingresos y gastos por ministerio con flujo de aprobación (colaborador → administrador).
2. Aplica automáticamente la regla de **aportación iglesia del 33 %** sobre ingresos de talento (cuenta 4105).
3. Calcula **kardex y saldo disponible** en tiempo real a partir de movimientos aprobados.
4. Ofrece reportes filtrables y exportación Excel para contabilidad.
5. Garantiza seguridad (JWT, roles, auditoría) y despliegue en la nube con costo reducido (Firebase + Render Free).

**Stack:** Angular 20 + Ionic 8 · Node.js + Express 5 · Firebase Firestore.

---

## Criterios de validación

| Criterio | Indicador | Estado |
|----------|-----------|--------|
| Requisitos funcionales implementados | RF-01 … RF-14 cubiertos en código | Cumplido |
| Reglas de negocio respetadas | Solo aprobados en balance; 33 % talento; cierre mensual | Cumplido |
| Pruebas automatizadas | ≥ 90 % casos en verde en CI | Cumplido (94/95 + 1 condicional) |
| Pruebas manuales por rol | CP-M01 … CP-M08 | Cumplido |
| Despliegue operativo | Health check + login en producción | Cumplido |
| Documentación trazable | Requisito → diseño → código → prueba | Cumplido — ver [METODOLOGIA.md](./METODOLOGIA.md) §12 |
| Validación con stakeholder | Revisión con administrador/contable IECA | Completado en fase de análisis |

---

## Resultados

### Técnicos

- **95 pruebas automatizadas** (46 frontend + 49 backend).
- **18 casos de uso** en 4 módulos (simplificación validada respecto a borrador inicial de 41).
- **Carga inicial optimizada** con `GET /api/bootstrap` (una petición tras login).
- **Kardex client-side** sin colección dedicada en Firestore.

### Funcionales

- Flujo completo registrado y verificado: ingreso de talento → aprobación → aportación 33 % → kardex con saldo **$41,94** (caso Andrés Quinde).
- Roles diferenciados: administrador aprueba; contable solo consulta; colaborador registra pendientes.
- Exportación Excel con kardex y desglose por ministerio/cuenta.

### Metodológicos

- Metodología en cascada con seis fases documentadas y cronograma Gantt.
- Tres ambientes académicos mapeados: laboratorio (I+D), biblioteca (almacenamiento), aula (producción).
- Trazabilidad requisito–prueba establecida.

---

## Conclusión parcial

El sistema cumple los objetivos planteados: digitalizar la gestión financiera de IECA con reglas de negocio institucionales (aprobación, aportación 33 %, kardex) y evidencia verificable mediante pruebas automatizadas y el caso de implementación documentado.
