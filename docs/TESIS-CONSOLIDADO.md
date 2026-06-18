# Documentación validada — Capítulo 3 (consolidado)

Índice único de todo el contenido académico validado para la tesis. Cada sección enlaza al documento detallado en `docs/`.

---

## 1. Requisitos y casos de uso

| Tema | Documento | Validado |
|------|-----------|----------|
| 18 casos de uso en 4 módulos | [CASOS-DE-USO.md](./CASOS-DE-USO.md) | Sí |
| RF-01 … RF-14, RNF-01 … RNF-06 | [REQUERIMIENTOS.md](./REQUERIMIENTOS.md) | Sí |
| Actores: Administrador, Contable, Colaborador | [REQUERIMIENTOS.md](./REQUERIMIENTOS.md) | Sí |

---

## 2. Diseño y diagramas

| Tema | Documento | Validado |
|------|-----------|----------|
| Arquitectura, clases, estados, CU, BD | [diagramas/](./diagramas/) | Sí |
| Metodología y fases en cascada | [METODOLOGIA.md](./METODOLOGIA.md) | Sí |

---

## 3. Implementación (caso real)

| Dato | Valor |
|------|-------|
| Colaborador | Andrés Quinde |
| Ministerio | Alabanza y Adoración |
| Ingreso #13 | 28/05/2026 — $182,00 — cuenta 4105 |
| Aportación 33 % | $60,06 |
| Saldo kardex final | **$41,94** |

Documento: [IMPLEMENTACION.md](./IMPLEMENTACION.md)

**Movimientos previos (Tabla 14):**

| Fecha | Tipo | Monto |
|-------|------|-------|
| 09/04/2026 | Gasto — Servicio de sonido | $72,00 |
| 12/04/2026 | Ingreso — Donación anónima | $17,00 |
| 14/05/2026 | Gasto — Papelería | $25,00 |

---

## 4. Verificación y plan de calidad

| Ámbito | Resultado |
|--------|-----------|
| Frontend | 46/46 SUCCESS |
| Backend | 48/49 pass (SMTP condicional) |
| Manuales CP-M01…CP-M08 | Verificados |

Documento: [VERIFICACION.md](./VERIFICACION.md)

---

## 5. Beneficiarios directos e indirectos

Documento: [BENEFICIARIOS.md](./BENEFICIARIOS.md)

**Directos:** colaboradores, administrador, contable, desarrolladora, IECA.  
**Indirectos:** feligresía, liderazgo pastoral, ministerios, auditores, futuras instituciones.

---

## 6. Entregables (EDT) y propuesta

Documento: [ENTREGABLES-Y-PROPUESTA.md](./ENTREGABLES-Y-PROPUESTA.md)

- Metodología: cascada (Waterfall)
- Tabla 30: EDT con 10 entregables (1.1 … 1.10)
- Propuesta: 3 capas, 4 módulos, prototipo en Firebase + Render

---

## 7. Criterios de validación y resultados

Documento: [CRITERIOS-VALIDACION-Y-RESULTADOS.md](./CRITERIOS-VALIDACION-Y-RESULTADOS.md)

- Validación técnica + usuarios IECA (V-01 … V-08)
- 6 resultados documentados
- Conclusión parcial

---

## 8. Scripts Word (titulación)

| Script | Función |
|--------|---------|
| `actualizar-capitulo3-secciones-finales-word.py` | Beneficiarios + Entregables + Propuesta en Cap. 3 |
| `actualizar-capitulo3-completo-word.py` | CU + plan calidad + cronograma + verificación |
| `actualizar-tabla-casos-uso-word.py` | Tabla 18 CU |
| `beneficiarios-contenido.py` | Texto fuente de beneficiarios |
| `entregables-propuesta-contenido.py` | Texto fuente EDT y propuesta |

Ver [scripts/README.md](./scripts/README.md).

---

## Archivo Word de tesis

Contenido aplicado en: `TITULACION/CAPITULO 3 - ENTENDERLO.docx` (fuera del repositorio).

---

*Última consolidación: junio 2026 — contenido validado con el usuario.*
