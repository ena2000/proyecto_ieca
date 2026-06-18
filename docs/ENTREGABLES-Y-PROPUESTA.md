# Entregables del proyecto

**Sistema Web de Gestión Financiera — IECA**  
Metodología: **cascada (Waterfall)**

---

De acuerdo con la metodología en cascada adoptada, los entregables se generan al cierre de cada fase. La EDT resume los productos del proyecto.

## Estructura de desglose del trabajo (EDT)

| Nivel | Entregable | Fase | Formato / ubicación |
|-------|------------|------|---------------------|
| 1 | Sistema Web de Gestión Financiera IECA | — | Producto final |
| 1.1 | Especificación de requisitos (RF, RNF y 18 CU) | Análisis | Capítulo 3 |
| 1.2 | Diagramas del sistema | Diseño | Capítulo 3 y `docs/diagramas/` |
| 1.3 | Modelo de base de datos Firestore | Diseño | Capítulo 3 — Base de datos |
| 1.4 | Código fuente frontend | Implementación | `src/` (Angular 20 + Ionic 8) |
| 1.5 | Código fuente backend | Implementación | `server/src/` (Node.js + Express 5) |
| 1.6 | Código ejecutable en producción | Despliegue | Firebase Hosting + Render |
| 1.7 | Informe de pruebas | Verificación | Tablas 22–26 |
| 1.8 | Manual de instalación y operación | Despliegue | `docs/DEPLOY.md` |
| 1.9 | Documentación técnica | Documentación | `README.md`, `docs/` |
| 1.10 | Respaldo JSON de demostración | Documentación | `docs/backup-demo-ieca.json` |

---

# Propuesta

La propuesta consiste en un **Sistema Web de Gestión Financiera** para IECA, orientado al uso en navegador de escritorio por administradores, contables y colaboradores de ministerio.

La solución se estructura en **tres capas**: presentación (Angular 20 e Ionic 8), aplicación (Node.js y Express 5 con API REST) y datos (Firebase Firestore). La seguridad se gestiona con JWT, roles y validación de entrada.

El sistema agrupa **cuatro módulos funcionales**: Seguridad y Acceso, Gestión Financiera y Flujo de Caja, Reportes y Analítica, y Administración del Sistema. Permite registrar ingresos y gastos por ministerio, aprobar movimientos, calcular la aportación iglesia del 33 % en ingresos de talento (cuenta 4105), generar reportes con kardex y exportar Excel.

El **prototipo** está construido y desplegado en Firebase Hosting y Render. Su funcionamiento se evidencia en el caso del ingreso #13 (ministerio Alabanza y Adoración, $182,00, saldo final en kardex $41,94) y en las 95 pruebas automatizadas más 8 casos manuales de aceptación.
