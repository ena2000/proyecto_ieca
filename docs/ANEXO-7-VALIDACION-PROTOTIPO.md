# Anexo 7 — Validación del prototipo (sustituye “Validación de expertos”)

**Word:** `Ctrl+F` → `Anexo 7.  Validación de expertos`  
**Acción:** Cambiar título del índice a **Anexo 7. Validación del prototipo**. Borrar todo desde “Juicios de expertos” hasta antes del Anexo 8. Pegar lo siguiente.

---

## Anexo 7. Validación del prototipo

La validación del sistema no utilizó juicio de expertos ni experimentación con animales, sino **verificación técnica** y **pruebas de aceptación** con usuarios institucionales de IECA, coherentes con el plan de calidad y las Tablas 30 a 35 del Capítulo III.

### Estrategia de validación

| Estrategia | Descripción | Evidencia |
|------------|-------------|-----------|
| Pruebas unitarias frontend | 46 casos (Karma + Jasmine) | Tabla 30 Cap. III |
| Pruebas backend | 49 casos (Node test runner); 48 obligatorios en verde | Tabla 31 Cap. III |
| Pruebas de integración HTTP | Supertest sobre API Express | Tabla 33 Cap. III |
| Pruebas de reglas de negocio | Aportación 33 %, roles, cierre | Tabla 34 Cap. III |
| Pruebas de aceptación manuales | 8 casos por rol (CP-M01 a CP-M08) | Tabla 35 Cap. III |
| Diagnóstico previo | Entrevista + encuesta n = 5 | Tabla 14; Tablas 15–21 Cap. III |

**Total pruebas automatizadas:** 95 (46 + 49). **Casos manuales:** 8. **CI:** GitHub Actions (lint, pruebas, build).

### Criterio de aceptación

El prototipo se considera validado cuando: (1) las pruebas automatizadas críticas superan en CI; (2) los casos manuales CP-M01 a CP-M08 quedan verificados con administrador, contable y colaborador; (3) la regla de aportación del 33 % se verifica en código y en el caso real del ingreso de talento (Tablas 27–29, Cap. III).

### Resultado

El sistema superó las 95 pruebas automatizadas y los 8 casos manuales de aceptación. La integración continua ejecuta verificación en cada cambio del repositorio. Los hallazgos del diagnóstico (registro manual, necesidad de sistema web centralizado) quedaron atendidos en los módulos implementados.

*Elaboración: investigadores. Fuente: repositorio del prototipo IECA y pruebas documentadas en el Capítulo III.*
