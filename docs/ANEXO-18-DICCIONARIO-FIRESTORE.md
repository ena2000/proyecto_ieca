# Anexo 18 — Diccionario de datos Firestore (borrador para tesis)

Contenido listo para pegar en Word cuando lo pidas.  
**Ubicación en tesis:** sección ANEXOS, después de Anexo 17 (Manual de usuario).

---

## Referencia en Capítulo 3 (antes de Figura 12)

**Ctrl+F:** `password_resets: códigos temporales`

Pegar después de la lista de colecciones:

> El detalle del catálogo de colecciones y el diccionario de datos (nombre de campo, tipo y descripción) se documentan en el **Anexo 18**, Tablas A.1 y A.2. En el cuerpo del capítulo se presenta la arquitectura general (Figura 12) y la descripción funcional de cada colección; el anexo complementa el esquema implementado en Firestore según los modelos del frontend y la validación Zod de la API.

---

## Anexo 18. Diccionario de datos Firestore

El presente anexo documenta el esquema lógico de la base de datos NoSQL del prototipo IECA en Firebase Firestore. El identificador del documento (`id`) es numérico secuencial en la mayoría de colecciones, salvo en `notificaciones`, `login_auditoria` y `password_resets`. Las relaciones se modelan por referencia (`ministerioId`, `usuarioId`, `ingresoIglesiaId`, `ingresoOrigenId`). El kardex y el saldo disponible no constituyen colección: se calculan en el cliente a partir de ingresos y gastos aprobados.

La vinculación entre el ingreso de talento y la aportación del 33 % en el ministerio General se registra en ambos documentos: `ingresoIglesiaId` en el ingreso del ministerio e `ingresoOrigenId` en el ingreso automático de General, coherente con la Figura 12 del Capítulo 3.

### Tabla A.1. Catálogo de colecciones Firestore

| Colección | Descripción | Relación principal |
|-----------|-------------|-------------------|
| usuarios | Cuentas del sistema: credenciales, rol y ministerio asignado | `ministerioId` → `ministerios.id` |
| ministerios | Departamentos o ministerios de IECA | Referenciado por usuarios, ingresos y gastos |
| ingresos | Movimientos de entrada (manual o automático por aportación 33 %) | `ministerioId` → `ministerios`; vínculo bidireccional talento ↔ aportación en General |
| gastos | Movimientos de salida por ministerio | `ministerioId` → `ministerios`; `usuarioId` → `usuarios` |
| notificaciones | Alertas in-app (ingreso, gasto, cierre) | `ministerioId` → `ministerios` |
| config | Configuración global (documento `sistema`) | Cierre mensual y metadatos de alertas |
| login_auditoria | Registro de intentos de inicio de sesión | Auditoría de seguridad |
| password_resets | Códigos temporales de recuperación de contraseña | `userId` → `usuarios.id` |

*Nota: Fuente: diseño e implementación del prototipo IECA — elaboración propia.*

### Tabla A.2. Diccionario de datos — campos principales

| Colección | Campo | Tipo | Descripción |
|-----------|-------|------|-------------|
| usuarios | id | Number | Identificador único del usuario |
| usuarios | usuario | String | Nombre de usuario para iniciar sesión |
| usuarios | nombre | String | Nombre completo |
| usuarios | email | String | Correo electrónico |
| usuarios | rol | String | Administrador, Contable o Colaborador |
| usuarios | estado | String | Activo / Inactivo |
| usuarios | ministerioId | Number | Ministerio asignado (FK → ministerios) |
| usuarios | passwordHash | String | Contraseña cifrada con bcrypt (solo servidor) |
| ministerios | id | Number | Identificador del ministerio |
| ministerios | nombre | String | Nombre del ministerio (ej. Alabanza, General) |
| ministerios | estado | String | Activo / Inactivo |
| ingresos | id | Number | Identificador del ingreso |
| ingresos | fecha | String (ISO) | Fecha del movimiento |
| ingresos | descripcion | String | Detalle del ingreso |
| ingresos | monto | Number | Monto bruto registrado |
| ingresos | cuentaCodigo / cuentaNombre | String | Cuenta contable (ej. 4105 — Talento y eventos) |
| ingresos | ministerioId | Number | Ministerio destino (FK → ministerios) |
| ingresos | usuarioId | Number | Usuario que registró (FK → usuarios) |
| ingresos | estado | String | pendiente / aprobado / rechazado |
| ingresos | esAportacionIglesia | Boolean | `true` si es el ingreso automático del 33 % en General |
| ingresos | aportacionGenerada | Boolean | En ingreso de talento: ya se generó la aportación |
| ingresos | ingresoIglesiaId | Number | En ingreso de **talento** (ministerio): ID del ingreso del 33 % en General |
| ingresos | ingresoOrigenId | Number | En ingreso de **aportación** (General): ID del ingreso de talento origen |
| ingresos | montoAportacionIglesia | Number | Monto del 33 % (ej. 60,06) |
| ingresos | montoNetoMinisterio | Number | Monto del 67 % en el ministerio (ej. 121,94) |
| ingresos | foto / comprobanteTipo | String | Comprobante adjunto (imagen o pdf) |
| ingresos | cerrado / periodoCierre | Boolean / String | Bloqueo por cierre mensual |
| gastos | id | Number | Identificador del gasto |
| gastos | fecha | String (ISO) | Fecha del movimiento |
| gastos | descripcion | String | Detalle del gasto |
| gastos | monto | Number | Valor del gasto |
| gastos | cuentaCodigo / cuentaNombre | String | Cuenta contable |
| gastos | ministerioId | Number | Ministerio (FK → ministerios) |
| gastos | estado | String | pendiente / aprobado / rechazado |
| gastos | foto / comprobanteTipo | String | Comprobante adjunto |
| notificaciones | tipo | String | ingreso / gasto / cierre |
| notificaciones | titulo / mensaje | String | Contenido de la alerta |
| notificaciones | ministerioId | Number | Ministerio relacionado |
| config | ultimoCierre | String | Último periodo cerrado |
| config | periodosCerrados | Array | Meses cerrados (YYYY-MM) |
| login_auditoria | usuario / ip | String | Usuario e IP del intento |
| login_auditoria | success | Boolean | Login exitoso o fallido |
| password_resets | userId | String | Usuario que solicita reset (FK → usuarios) |
| password_resets | expiresAt | String (ISO) | Vencimiento del código temporal |

*Nota: Esquema según modelos del frontend y validación Zod en la API. Campos opcionales según tipo de movimiento y flujo de aprobación. Fuente: investigación propia.*

---

## Checklist al pegar en Word

1. Cap. 3: párrafo de referencia al Anexo 18 (antes de Figura 12).
2. ANEXOS: bloque completo Anexo 18 después de Anexo 17.
3. Índice de anexos: agregar **Anexo 18. Diccionario de datos Firestore**.
4. Tabla 28 (EDT), opcional: Formato del ítem 1.3 → `Capítulo 3 y Anexo 18`.

---

## Vínculo ingreso talento ↔ aportación 33 %

```
Ingreso #13 (Alabanza)  ──ingresoIglesiaId──►  Ingreso aportación (General)
        ◄──ingresoOrigenId──
```

Coherente con Figura 12 (`ingresoIglesiaId`) y Tabla A.2 (ambos campos).
