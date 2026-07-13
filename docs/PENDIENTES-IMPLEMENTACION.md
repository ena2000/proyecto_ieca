# Pendientes de implementación — post checklist producción

Items acordados para corregir **al final**, después de cerrar **F** y **G** del checklist manual. No bloquean la validación funcional.

---

| ID | Tema | Descripción | Ubicación |
|----|------|-------------|-----------|
*Última actualización: jul 2026 (P-02 / P-03).*

| **P-01** | Aportación al aprobar | ~~El ingreso automático del 33 % tarda en aparecer~~ **Corregido** (vista optimista + merge reload). | `ingresos.service.ts`, `aportacion-iglesia.util.ts` |
| **P-02** | Ocultar **General** | ~~Aparecía en filtros de ingresos/gastos~~ **Corregido**: formularios y filtros usan catálogo sin General; reportes sí lo muestran (aportación). | `movimiento-ministerio.util.ts`, ingresos/gastos |
| **P-03** | Reportes | ~~Montos en $0 hasta clic; tabla se “reseteaba” al elegir ministerio~~ **Corregido**: `detectChanges` en cada actualización; desglose no colapsa; `compareWith` en el select. | `reportes.component.ts` |
| **P-04** | Parpadeo «ministerio ya existe» | ~~Tras crear, mensaje congelado~~ **Corregido**: reset del formulario antes del toast de éxito. | `ministerios.component.ts` |

---

*Última actualización: sesión checklist F (jun 2026).*
