# Casos de uso — Gestión Financiera IECA

Especificación validada: **18 casos de uso** agrupados en **4 módulos funcionales**. Sustituye la versión anterior de 41 casos en 10 módulos.

Documentos relacionados: [REQUERIMIENTOS.md](./REQUERIMIENTOS.md) · [BENEFICIARIOS.md](./BENEFICIARIOS.md) · [VERIFICACION.md](./VERIFICACION.md)

---

## Módulos y actores

| # | Módulo | Actores | Casos de uso |
|---|--------|---------|--------------|
| 1 | Seguridad y Acceso (Autenticación) | Administrador, Contable, Colaborador | CU-01, CU-02, CU-03, CU-16 |
| 2 | Gestión Financiera y Flujo de Caja | Colaborador, Administrador, Contable | CU-04, CU-05, CU-06, CU-07, CU-17, CU-18 |
| 3 | Reportes y Analítica | Administrador, Contable, Colaborador | CU-08, CU-09 |
| 4 | Administración del Sistema y Soporte | Administrador | CU-10 a CU-15 |

---

## Tabla de casos de uso

| ID | Caso de uso | Módulo | Actor principal | Descripción breve |
|----|-------------|--------|-----------------|-------------------|
| CU-01 | Iniciar sesión | Seguridad y Acceso | Administrador, Contable, Colaborador | Login con JWT y carga inicial de datos (`GET /api/bootstrap`) |
| CU-02 | Recuperar contraseña | Seguridad y Acceso | Administrador, Contable, Colaborador | Código por correo y restablecimiento |
| CU-03 | Cambiar contraseña | Seguridad y Acceso | Administrador, Contable, Colaborador | Cambio obligatorio en primer acceso |
| CU-04 | Registrar ingreso | Gestión Financiera | Colaborador, Administrador | Alta con comprobante; queda pendiente si es colaborador |
| CU-05 | Registrar gasto | Gestión Financiera | Colaborador, Administrador | Alta con comprobante; queda pendiente si es colaborador |
| CU-06 | Aprobar movimiento | Gestión Financiera | Administrador | Aprueba ingreso o gasto; genera aportación 33 % si es talento (4105) |
| CU-07 | Rechazar movimiento | Gestión Financiera | Administrador | Rechaza con motivo |
| CU-08 | Consultar dashboard | Reportes y Analítica | Administrador, Contable, Colaborador | KPIs y gráficos con movimientos aprobados |
| CU-09 | Generar reportes | Reportes y Analítica | Administrador, Contable, Colaborador | Filtros, desglose, kardex y exportación Excel |
| CU-10 | Gestionar ministerios | Administración | Administrador | CRUD, saldo disponible y kardex |
| CU-11 | Gestionar usuarios | Administración | Administrador | CRUD con roles y asignación de ministerio |
| CU-12 | Ejecutar cierre mensual | Administración | Administrador | Cierra periodo y bloquea movimientos del mes |
| CU-13 | Backup y restauración | Administración | Administrador | Exportar e importar respaldo JSON |
| CU-14 | Consultar auditoría | Administración | Administrador | Historial de movimientos y exportación CSV |
| CU-15 | Enviar alertas por correo | Administración | Administrador | Pendientes antiguos y aviso de cierre |
| CU-16 | Consultar notificaciones | Seguridad y Acceso | Administrador, Contable, Colaborador | Ver y marcar alertas en la interfaz |
| CU-17 | Consultar movimientos generales | Gestión Financiera | Contable | Consulta de ingresos y gastos en modo solo lectura |
| CU-18 | Consultar mis movimientos | Gestión Financiera | Colaborador | Consulta de movimientos de su ministerio |

---

## Diagramas asociados

Carpeta [diagramas/](./diagramas/):

| Archivo | Contenido |
|---------|-----------|
| `DIAGRAMA CASOS DE USO 1.png` | Módulo 1 — Seguridad y Acceso |
| `DIAGRAMA DE CASOS DE USO 2.png` | Módulo 2 — Gestión Financiera |
| `DIAGRAMA DE CASOS DE USO 3.png` | Módulo 3 — Reportes |
| `DIAGRAMA CASO DE USO 4.png` | Módulo 4 — Administración |
| `DIAGRAMA CASOS DE USO INTEGRADO - ANEXO 18.png` | Vista integrada |

---

## Trazabilidad con requisitos

| Casos de uso | Requisitos relacionados |
|--------------|-------------------------|
| CU-01, CU-02, CU-03 | RF-01 |
| CU-04, CU-05, CU-06, CU-07 | RF-02, RF-03, RF-04, RF-12, RF-15 |
| CU-08 | RF-07 |
| CU-09 | RF-08 |
| CU-10, CU-11 | RF-05, RF-06, RF-14 |
| CU-12 | RF-09 |
| CU-13, CU-14, CU-15 | RF-10 |
| CU-16 | RF-11 |
| CU-17, CU-18 | RF-02, RF-03, RF-04 |
| CU-01 (bootstrap) | RF-13 |

Detalle de requisitos: [REQUERIMIENTOS.md](./REQUERIMIENTOS.md).  
Verificación asociada: [VERIFICACION.md § Trazabilidad](./VERIFICACION.md#trazabilidad-requisito--caso-de-uso--prueba).
