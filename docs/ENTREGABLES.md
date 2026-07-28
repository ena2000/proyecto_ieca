# Entregables del proyecto

**Sistema Web de Gestión Financiera — IECA**  
Metodología: **cascada (Waterfall)**

De acuerdo con la metodología en cascada adoptada, los entregables se generan al cierre de cada fase. La **EDT** (Estructura de Desglose del Trabajo) resume los productos del proyecto.

Documentos relacionados: [PROPUESTA.md](./PROPUESTA.md) · [REQUERIMIENTOS.md](./REQUERIMIENTOS.md) · [CASOS-DE-USO.md](./CASOS-DE-USO.md) · [VERIFICACION.md](./VERIFICACION.md)

---

## Estructura de desglose del trabajo (EDT)

| Nivel | Entregable | Fase | Formato / ubicación |
|-------|------------|------|---------------------|
| **1** | **Sistema Web de Gestión Financiera IECA** | — | Producto final |
| 1.1 | Especificación de requisitos (RF, RNF y 18 CU) | Análisis | [REQUERIMIENTOS.md](./REQUERIMIENTOS.md) + [CASOS-DE-USO.md](./CASOS-DE-USO.md) |
| 1.2 | Diagramas del sistema | Diseño | Capítulo 3 · [diagramas/](./diagramas/) |
| 1.3 | Modelo de base de datos Firestore | Diseño | Capítulo 3 — Base de datos |
| 1.4 | Código fuente frontend | Implementación | `src/` (Angular 20 + Ionic 8) |
| 1.5 | Código fuente backend | Implementación | `server/src/` (Node.js + Express 5) |
| 1.6 | Código ejecutable en producción | Despliegue | Firebase Hosting + Render |
| 1.7 | Informe de pruebas | Verificación | [VERIFICACION.md](./VERIFICACION.md) |
| 1.8 | Manual de instalación y operación | Despliegue | [DEPLOY.md](./DEPLOY.md) |
| 1.9 | Documentación técnica | Documentación | `README.md` · [docs/README.md](./README.md) |
| 1.10 | Respaldo JSON de demostración | Documentación | [backup-demo-ieca.json](./backup-demo-ieca.json) |

---

## Resumen por fase

| Fase | Entregables principales |
|------|-------------------------|
| **1. Análisis** | Requisitos (RF/RNF), 18 casos de uso, beneficiarios |
| **2. Diseño** | Diagramas UML, arquitectura, modelo Firestore |
| **3. Implementación** | Frontend, backend, reglas de negocio (33 %, kardex, cierre) |
| **4. Verificación** | 184 pruebas automatizadas, 8 manuales, criterios V-01…V-08 |
| **5. Despliegue** | Producción en Firebase + Render, manual DEPLOY |
| **6. Documentación** | `docs/`, backup demo, índice de tesis |

---

## Respaldo demo (1.10)

El archivo `backup-demo-ieca.json` incluye:

- **22 ministerios** (lista IECA 2024 + General)
- **182 usuarios** (2 administradores, 1 contable, 179 colaboradores)
- Ingresos y gastos de prueba para kardex, reportes y flujo de aprobación

---

*Ver [METODOLOGIA.md](./METODOLOGIA.md) para trazabilidad fase → entregable.*
