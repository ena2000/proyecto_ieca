# Pendientes de implementación — post checklist producción

Items acordados para corregir **al final**, después de cerrar **F** y **G** del checklist manual. No bloquean la validación funcional.

---

| ID | Tema | Descripción | Ubicación |
|----|------|-------------|-----------|
| **P-01** | Aportación al aprobar | ~~El ingreso automático del 33 % tarda en aparecer~~ **Corregido en código** (vista optimista + merge reload); falta **deploy** a Firebase. | `ingresos.service.ts`, `aportacion-iglesia.util.ts` |
| **P-02** | Ocultar **General** | ~~No mostrar ministerio General donde el usuario no debe elegirlo~~ **Corregido en código**: formularios y filtros de ingresos/gastos/usuarios usan catálogo sin General; reportes sí lo incluyen. | `ministerios-catalogo.constants.ts`, filtros de páginas |
| **P-03** | Reportes | ~~Montos en $0 hasta clic~~ **Corregido en código**: `detectChanges` tras bootstrap + hint vacío cuando no hay movimientos. | `reportes.component.ts` |
| **P-04** | Parpadeo «ministerio ya existe» | ~~Tras crear, mensaje congelado al cambiar nombre tras duplicado.~~ **Corregido en código** (`ministerios.component`); falta **deploy** a Firebase. | `ministerios.component.ts/html` |

---

*Última actualización: sesión UX escritorio (jul 2026).*
