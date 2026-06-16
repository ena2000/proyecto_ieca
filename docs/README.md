# Documentación del proyecto — Gestión Financiera IECA

Índice de la documentación académica y técnica del **Sistema Web de Gestión Financiera** de la Iglesia Evangélica La Alborada (IECA). Todo el material de tesis (diagramas, casos de uso, requisitos, verificación e implementación) está centralizado en esta carpeta.

---

## Documentos principales

| Documento | Contenido |
|-----------|-----------|
| [METODOLOGIA.md](./METODOLOGIA.md) | Metodología en cascada, viabilidad, tres ambientes (laboratorio, biblioteca, aula), fases, plan de calidad y cronograma |
| [REQUERIMIENTOS.md](./REQUERIMIENTOS.md) | Actores, requisitos funcionales (RF-01…RF-14), no funcionales (RNF-01…RNF-06) y reglas de negocio validadas |
| [CASOS-DE-USO.md](./CASOS-DE-USO.md) | **18 casos de uso** en **4 módulos** (versión simplificada validada) |
| [IMPLEMENTACION.md](./IMPLEMENTACION.md) | Caso de implementación: ingreso de talento, aportación 33 %, kardex (Andrés Quinde, ministerio Alabanza) |
| [VERIFICACION.md](./VERIFICACION.md) | Resultados de pruebas automatizadas (46/46 frontend, 48/49 backend) y casos manuales CP-M01…CP-M08 |
| [ENTREGABLES-ACADEMICOS.md](./ENTREGABLES-ACADEMICOS.md) | Beneficiarios, entregables, propuesta, criterios de validación y resultados |
| [DEPLOY.md](./DEPLOY.md) | Despliegue en Firebase Hosting + Render |
| [CHANGELOG.md](./CHANGELOG.md) | Historial resumido de entregas del repositorio |

---

## Diagramas

Los diagramas UML y de arquitectura están en **[diagramas/](./diagramas/)** (PNG exportados + archivo Gantt).

| Archivo | Descripción |
|---------|-------------|
| `DIAGRAMA CASOS DE USO 1.png` … `4.png` | Casos de uso por módulo (4 módulos) |
| `DIAGRAMA CASOS DE USO INTEGRADO - ANEXO 18.png` | Vista integrada de los 18 casos de uso |
| `DIAGRAMA DE ARQUITECTURA - REDUCIDO.png` / `COMPLETO.png` | Arquitectura en capas |
| `DIAGRAMA DE ARQUITECTURA DE LA BASE DE DATOS.png` | Modelo Firestore |
| `DIAGRAMA DE CLASES - REDUCIDO.png` / `COMPLETO.png` | Diagrama de clases |
| `DIAGRAMA DE ESTADO - REDUCIDO.png` / `COMPLETO.png` | Estados de movimientos |
| `cronograma-ieca.gan` | Cronograma editable (GanttProject) |

---

## Datos y scripts

| Recurso | Uso |
|---------|-----|
| [backup-demo-ieca.json](./backup-demo-ieca.json) | Respaldo JSON de ejemplo para restauración y pruebas de kardex |
| [scripts/](./scripts/) | Scripts Python para actualizar tablas y secciones en documentos Word de titulación |

---

## Referencia rápida — números validados

| Concepto | Valor |
|----------|-------|
| Casos de uso | 18 en 4 módulos |
| Requisitos funcionales | RF-01 … RF-14 |
| Requisitos no funcionales | RNF-01 … RNF-06 |
| Pruebas frontend | 46/46 SUCCESS |
| Pruebas backend | 48/49 pass (1 condicional SMTP) |
| Aportación iglesia | 33 % sobre cuenta 4105 (talento) |
| Caso de implementación | Ingreso #13 — $182,00 — saldo final $41,94 |

---

*Proyecto privado — uso académico e institucional para IECA.*
