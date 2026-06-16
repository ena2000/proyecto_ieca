# Caso de implementación — Gestión Financiera IECA

Evidencia del funcionamiento del sistema con un flujo real: registro de ingreso de talento, aportación automática del 33 % y actualización del kardex por ministerio.

**Colaborador:** Andrés Quinde  
**Ministerio:** Alabanza y Adoración  
**Ingreso:** #13 — fecha 28/05/2026 — cuenta 4105 (Talento y eventos) — monto bruto **$182,00**

---

## 1. Obtención y carga de datos

Tras el login, el frontend ejecuta `GET /api/bootstrap`, que agrega en una sola llamada ingresos, gastos, ministerios y demás datos según el rol (`scopeForUser`: colaborador solo ve su `ministerioId`).

**Archivo:** `server/src/routes/bootstrap.routes.ts`

Solo los movimientos **aprobados** participan en balance, kardex y saldo disponible.

---

## 2. Movimientos previos al ingreso #13

**Tabla 14.** Movimientos aprobados previos al ingreso #13 — ministerio Alabanza y Adoración

| Fecha | Tipo | Descripción | Monto ($) | Estado |
|-------|------|-------------|-----------|--------|
| 09/04/2026 | Gasto | Servicio de sonido | 72,00 | Aprobado |
| 12/04/2026 | Ingreso | Donación anónima (Otros ingresos) | 17,00 | Aprobado |
| 14/05/2026 | Gasto | Papelería | 25,00 | Aprobado |

**Saldo antes del ingreso #13** (solo Tabla 14):

```
0 − 72 + 17 − 25 = −80,00
```

El ministerio estaba en **−$80,00** antes de aprobar el ingreso de Andrés.

---

## 3. Registro del ingreso #13

Andrés Quinde registra un ingreso de **$182,00** en cuenta **4105 — Talento y eventos**. Como colaborador, el movimiento queda en estado **pendiente** hasta que el administrador lo aprueba.

---

## 4. Cálculo de la aportación iglesia (33 %)

Constante del sistema (`aportacion-iglesia.constants.ts`):

```
APORTACION_IGLESIA_PORCENTAJE = 0.33
```

**Cálculo para y = 182,00:**

| Concepto | Fórmula | Resultado |
|--------|---------|-----------|
| Aportación iglesia | round(182 × 0,33 × 100) / 100 | **$60,06** |
| Monto neto ministerio | 182 − 60,06 | **$121,94** |

Al aprobar, el sistema genera automáticamente un ingreso del 33 % en el ministerio **General** y el ministerio Alabanza conserva el 67 % en su saldo y kardex.

**Archivos:** `src/app/shared/utils/aportacion-iglesia.util.ts`, `server/src/utils/aportacion-iglesia.ts`

---

## 5. Aprobación por el administrador

El administrador ejecuta `PATCH /api/ingresos/:id/aprobar`. El ingreso #13 pasa a **aprobado** y se dispara la lógica de aportación. El movimiento automático de aportación no es editable ni borrable de forma independiente.

---

## 6. Kardex del ministerio (Tabla 18)

El kardex se calcula en orden **cronológico ascendente** por fecha; la interfaz muestra el más reciente arriba (`.reverse()` en `ministerios.component.ts` y `reportes.component.ts`).

**Cálculo línea a línea:**

| Fecha | Tipo | Monto | Saldo acumulado |
|-------|------|-------|-----------------|
| 09/04/2026 | Gasto sonido | −72,00 | −72,00 |
| 12/04/2026 | Ingreso donación | +17,00 | −55,00 |
| 14/05/2026 | Gasto papelería | −25,00 | −80,00 |
| 28/05/2026 | Ingreso talento #13 (neto 67 %) | +121,94 | **41,94** |

**Saldo disponible final del ministerio: $41,94**

Verificación: −80,00 + 121,94 = **41,94** ✓

---

## 7. Referencias de código

| Funcionalidad | Ubicación |
|---------------|-----------|
| Bootstrap | `server/src/routes/bootstrap.routes.ts` |
| Aportación 33 % | `aportacion-iglesia.util.ts`, `server/src/utils/aportacion-iglesia.ts` |
| Kardex | `src/app/services/data.service.ts` → `getKardexMinisterio()` |
| Aprobación | `server/src/utils/ingresos.ts`, `ingresos.service.ts` |
| Datos demo | `docs/backup-demo-ieca.json` |

---

## 8. Diagramas relacionados

- [diagramas/DIAGRAMA DE ESTADO - REDUCIDO.png](./diagramas/DIAGRAMA%20DE%20ESTADO%20-%20REDUCIDO.png) — Estados pendiente/aprobado/rechazado
- [diagramas/DIAGRAMA DE CLASES - REDUCIDO.png](./diagramas/DIAGRAMA%20DE%20CLASES%20-%20REDUCIDO.png) — Modelo de dominio
