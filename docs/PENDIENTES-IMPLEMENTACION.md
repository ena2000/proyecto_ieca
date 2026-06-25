# Pendientes de implementación — post checklist producción

Items acordados para corregir **al final**, después de cerrar **F** y **G** del checklist manual. No bloquean la validación funcional.

---

| ID | Tema | Descripción | Ubicación |
|----|------|-------------|-----------|
| **P-01** | Aportación al aprobar | El ingreso automático del 33 % tarda en aparecer en lista/dashboard tras aprobar talento. | `ingresos.service.ts`, aportación iglesia |
| **P-02** | Ocultar **General** | No mostrar ministerio General donde el usuario no debe elegirlo (formularios/filtros). | `ministerios-catalogo.constants.ts` |
| **P-03** | Reportes | Montos en **$0** hasta clic; reset al cambiar ministerio. | `reportes.component.ts` |
| **P-04** | Parpadeo «ministerio ya existe» | ~~Tras crear, mensaje congelado al cambiar nombre tras duplicado.~~ **Corregido en código** (`ministerios.component`); falta **deploy** a Firebase. | `ministerios.component.ts/html` |

---

*Última actualización: sesión checklist F (jun 2026).*
