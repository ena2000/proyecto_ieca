# Metodología de investigación — Gestión Financiera IECA

Adaptación de la **plantilla universidad** al proyecto tecnológico IECA (ingeniería de requisitos, sin encuesta n = 203).

---

## Metodología de investigación

Para una propuesta tecnológica como el Sistema Web de Gestión Financiera de IECA, se aplicó una metodología de investigación que permitió **explorar y diagnosticar** la problemática: registro manual y disperso de ingresos y gastos por ministerio, falta de trazabilidad en aprobaciones y dificultad para calcular saldos y la aportación iglesia del 33 %.

La metodología es de tipo **diagnóstica y descriptiva**, diseño **no experimental**, basada en **ingeniería de requisitos**. No se realizó investigación con muestreo probabilístico ni encuesta masiva (plantilla n = 203), porque el trabajo es **desarrollo tecnológico**: construir y validar un prototipo, no inferir sobre 750 personas.

**Justificación (criterio del docente):** la recolección se sustituyó por ingeniería de requisitos — entrevistas, observación y revisión documental — para evidenciar **problemática**, **factibilidad** y **requerimientos** (RF, RNF, casos de uso).

| Plantilla universidad | Proyecto IECA |
|----------------------|---------------|
| Encuesta 750 → n = 203 | Muestra intencional **5 personas** por rol |
| Estratos Alto/Medio/Bajo | Estratos por **rol** (admin, contable, colaborador) |
| Minería de datos | Análisis de requisitos + **pruebas del software** |
| Ejemplo “¿Tiene mascotas?” | Pregunta 1 sobre **registro de movimientos** |

---

## Población y muestra

### Población

Personas vinculadas a la **gestión financiera de IECA**: administrador, contable y colaboradores de ministerio. Estimada en **8 a 12 personas**. Características: conocen el proceso contable, usaban registros manuales y participan en aprobaciones o reportes. Unidades de análisis: **stakeholders del proceso financiero** (diseño no experimental).

### Muestra

**Muestreo intencional por criterio** (no probabilístico). **No se aplicó** la fórmula n = P×Q×N/(…). Total: **5 personas** (1 administrador, 1 contable, 3 colaboradores).

**Tabla 31. Determinación de la muestra por rol — proyecto IECA**

| Rol / estrato | Población (aprox.) | Muestra | Criterio |
|---------------|-------------------|---------|----------|
| Administrador IECA | 1 | 1 | Aprobaciones y cierre |
| Contable IECA | 1 | 1 | Reportes y conciliación |
| Colaboradores | 6–10 | 3 | Ministerios con movimientos |
| **Total** | **8–12** | **5** | Por rol |

*Nota: No se calculó f = 203/750; población institucional acotada. Fuente: entrevistas propias — IECA.*

---

## Procesamiento y análisis

- **Cualitativo (manual):** transcripción de entrevistas → matriz problemática–requisito → RF, RNF, 18 CU.
- **Cuantitativo (mecánico):** pruebas automatizadas (Karma, Node test runner, CI).

**No se aplicó:** minería de datos, ANOVA, regresión, chi-cuadrado sobre encuesta masiva, redes neuronales.

**Sí se aplicó:** frecuencias absolutas y relativas sobre entrevistas (n = 5) y sobre resultados de pruebas (n = 95 casos).

---

## Técnicas e instrumentos de recolección de datos

| Técnica | Instrumento | Evidencia |
|---------|-------------|-----------|
| Entrevista semiestructurada | Guía de preguntas (Anexo) | Problemática y requisitos |
| Observación | Registro de campo | Proceso manual actual |
| Revisión documental | Política contable IECA | Factibilidad, regla 33 % |
| Prueba de aceptación | CP-M01…CP-M08 | Validación con usuarios |
| Prueba automatizada | 95 casos en CI | Verificación técnica |

---

## Ejemplo de análisis (como plantilla pregunta 4 — mascotas)

**Pregunta 1:** ¿Cómo registra actualmente los ingresos y gastos de su ministerio?

**Tabla 32. Pregunta 1 — Entrevistas (n = 5)**

| Opción | Frec. absoluta | Frec. relativa |
|--------|----------------|----------------|
| En hojas o cuadernos | 3 | 60,00 % |
| Mensajes (WhatsApp) u otros | 2 | 40,00 % |
| Sistema digital integrado | 0 | 0,00 % |
| **TOTAL** | **5** | **100,00 %** |

**Figura X.** Gráfico de barras — Pregunta 1. *(Insertar en Word.)*

**Análisis:** El 100 % usa métodos manuales o dispersos; ninguno tiene sistema integrado. Confirma la problemática y justifica registro digital, aprobación, kardex y reportes.

---

**Tabla 33. Pruebas automatizadas del prototipo**

| Ámbito | Ejecutados | Superados | Frec. relativa |
|--------|------------|-----------|----------------|
| Frontend | 46 | 46 | 100,00 % |
| Backend | 49 | 48 | 97,96 % |
| **Total** | **95** | **94** | **98,95 %** |

**Análisis:** 98,95 % superado; 1 caso SMTP en local sin impacto en lógica de negocio.

---

## Metodología de investigación vs desarrollo

| | Investigación | Desarrollo |
|---|---------------|------------|
| **Objetivo** | Diagnosticar y especificar requisitos | Construir el prototipo |
| **Método** | Ingeniería de requisitos | Cascada (Waterfall) |
| **Producto** | RF, RNF, 18 CU | Código, pruebas, despliegue |

---

*Word: `scripts/agregar-metodologia-investigacion-capitulo3-word.py` · Ver [METODOLOGIA.md](./METODOLOGIA.md) (desarrollo).*
