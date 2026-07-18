# Beneficiarios directos e indirectos

**Sistema Web de Gestión Financiera — Iglesia Evangélica La Alborada (IECA)**

Documentos relacionados: [CASOS-DE-USO.md](./CASOS-DE-USO.md) · [VERIFICACION.md](./VERIFICACION.md) · [REQUERIMIENTOS.md](./REQUERIMIENTOS.md)

---

Todo proyecto tecnológico con impacto social y económico beneficia no solo a quienes usan la herramienta, sino también a su entorno. En IECA, el sistema de gestión financiera trasciende el panel administrativo y llega a toda la institución.

El estudio de beneficiarios permite ubicar a cada actor, valorar su interés y su incidencia en el proyecto, y distinguir quién recibe un impacto inmediato y quién de forma mediada. Los **beneficiarios directos** son quienes operan el sistema y obtienen una utilidad práctica en su labor diaria.

---

## Beneficiarios directos

| Actor | Beneficio principal |
|-------|---------------------|
| **Colaboradores de ministerio** | Registran ingresos y gastos, anexan comprobantes, consultan estado (pendiente/aprobado/rechazado) y saldo en kardex. Sustituyen anotaciones dispersas por trazabilidad digital. |
| **Administrador** (Milena Mariscal Ponce, Orbe Jimenez) | Aprueba o rechaza movimientos, gestiona usuarios y ministerios, ejecuta cierre mensual, genera respaldos y revisa auditoría. |
| **Contable** (Diznarda Quezada) | Consulta reportes, analiza totales por ministerio y cuenta, exporta Excel y recibe alertas. No aprueba movimientos. |
| **Desarrolladora** | Producto operativo, documentado y validado (184 pruebas automatizadas + 8 manuales). |
| **Institución IECA** | Propietaria del sistema (Firebase Hosting + Render); administración financiera centralizada por ministerio. |

Entre los colaboradores se incluyen los **179 usuarios** del respaldo demo según la lista IECA 2024 (`backup-demo-ieca.json`), cada uno asignado a un solo ministerio.

---

## Beneficiarios indirectos

| Actor | Beneficio |
|-------|-----------|
| **Feligresía** | Mayor transparencia en ofrendas y recursos ministeriales. |
| **Liderazgo pastoral y ministerios** | Reportes y saldos para decisiones informadas. |
| **Auditores internos** | Historial exportable y trazabilidad de movimientos. |
| **Otras instituciones** (futuro) | Posible reutilización del prototipo para gestión por departamentos en la nube. |

---

*Proyecto privado — uso académico e institucional para IECA.*
