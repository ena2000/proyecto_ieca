# Anexo 7 — Validación del prototipo

Documento de referencia del **repositorio**. La validación del sistema se documenta aquí como **verificación técnica** y **pruebas de aceptación** (no como juicio de expertos / Delphi).

> **Word:** la plantilla de tesis ya fue enviada a revisión. **No modificar el Word** desde este archivo hasta que el revisor lo devuelva.

---

## Estrategia de validación

La validación del prototipo no utiliza juicio de expertos ni experimentación con animales, sino **verificación técnica** y **pruebas de aceptación** con usuarios institucionales de IECA, coherentes con el plan de calidad y las tablas de pruebas del Capítulo III.

| Estrategia | Descripción | Evidencia |
|------------|-------------|-----------|
| Pruebas unitarias frontend | 117 casos (Karma + Jasmine) | [VERIFICACION.md](./VERIFICACION.md) §3 |
| Pruebas backend | 68 casos (Node test runner); 68 en verde | [VERIFICACION.md](./VERIFICACION.md) §3 |
| Pruebas de integración HTTP | Supertest sobre API Express | `http.integration.test.js`, `security-rules.integration.test.js` |
| Pruebas de reglas de negocio | Aportación 33 %, roles, cierre | CP-M03; specs de aportación / cierre |
| Pruebas de aceptación manuales | 8 casos por rol (CP-M01 a CP-M08) | [VERIFICACION.md](./VERIFICACION.md) §4 · criterios V-01…V-08 |
| Diagnóstico previo | Entrevista + encuesta n = 5 | [RESULTADOS-ENCUESTA-DIAGNOSTICA.md](./RESULTADOS-ENCUESTA-DIAGNOSTICA.md) |

**Total pruebas automatizadas:** 185 (117 + 68). **Casos manuales:** 8. **CI:** GitHub Actions (lint, pruebas, build).

### Criterio de aceptación

El prototipo se considera validado cuando:

1. Las pruebas automatizadas críticas superan en CI (**185/185**).
2. Los casos manuales CP-M01 a CP-M08 quedan verificados con administrador, contable y colaborador.
3. La regla de aportación del 33 % se verifica en código y en el caso real del ingreso de talento ([IMPLEMENTACION.md](./IMPLEMENTACION.md), saldo kardex **$41,94**).

### Resultado

El sistema superó las 185 pruebas automatizadas y los 8 casos manuales de aceptación. La integración continua ejecuta verificación en cada cambio del repositorio. Los hallazgos del diagnóstico (registro manual, necesidad de sistema web centralizado) quedaron atendidos en los módulos implementados.

*Elaboración: investigadores. Fuente: repositorio del prototipo IECA y [VERIFICACION.md](./VERIFICACION.md).*
