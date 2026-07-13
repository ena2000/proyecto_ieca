# Pendientes de implementación — post checklist producción

Items acordados para corregir **al final**, después de cerrar **F** y **G** del checklist manual. No bloquean la validación funcional.

---

| ID | Tema | Descripción | Ubicación |
|----|------|-------------|-----------|
*Última actualización: sesión P-01 (jun 2026).*

| **P-01** | Aportación al aprobar | ~~El ingreso automático del 33 % tarda en aparecer~~ **Corregido en código** (vista optimista + merge reload); falta **deploy** a Firebase. | `ingresos.service.ts`, `aportacion-iglesia.util.ts` |
| **P-02** | Ocultar **General** | No mostrar ministerio General donde el usuario no debe elegirlo (formularios/filtros). | `ministerios-catalogo.constants.ts` |
| **P-03** | Reportes | Montos en **$0** hasta clic; reset al cambiar ministerio. | `reportes.component.ts` |
| **P-04** | Parpadeo «ministerio ya existe» | ~~Tras crear, mensaje congelado~~ **Corregido**: reset del formulario antes del toast de éxito. | `ministerios.component.ts` |

---

*Última actualización: sesión checklist F (jun 2026).*
