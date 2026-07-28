# Metodología de investigación — Gestión Financiera IECA

Texto listo para Capítulo 3 (plantilla universidad, adaptado al proyecto IECA).

---

## Metodologías del proyecto

El proyecto aplica **dos metodologías complementarias**: una de **investigación** (enfoque cualitativo, tipo aplicada, alcance diagnóstico y descriptivo) para identificar la problemática, la factibilidad y los requerimientos del sistema financiero de IECA; y una de **desarrollo** en **modelo cascada (Waterfall)**, para construir y validar el prototipo web de forma secuencial.

En este capítulo se desarrollan ambas: la metodología de investigación (población, muestra, recolección y análisis de datos) y la metodología de desarrollo y verificación (fases, entregables, plan de calidad, cronograma y pruebas del sistema). Ver [METODOLOGIA.md](./METODOLOGIA.md) para el detalle del desarrollo.

---

## Metodología de investigación

Para una propuesta tecnológica como el Sistema Web de Gestión Financiera de la Iglesia Evangélica La Alborada (IECA), se aplicó una investigación que permitió explorar y diagnosticar el problema de estudio: el registro manual y disperso de ingresos y gastos por ministerio, la falta de trazabilidad en las aprobaciones y la dificultad para calcular saldos y la aportación iglesia del 33 %.

La investigación se desarrolló bajo un **enfoque cualitativo**, con **tipo aplicada**, **alcance diagnóstico y descriptivo** y **diseño no experimental**. Se empleó **muestreo no probabilístico por criterio (intencional)** y, como técnicas de recolección de información, la **entrevista semiestructurada**, la **observación** del proceso actual y la **revisión documental**. Mediante estas técnicas se evidenciaron la **problemática**, la **factibilidad** y los **requerimientos** del sistema propuesto, a partir de una muestra de **n = 5 personas** (1 administrador, 1 contable y 3 colaboradores de ministerio). El cálculo muestral teórico (n ≈ 111) se incluye más adelante como referencia metodológica conforme a la plantilla institucional.

En esta sección se presentan la población y muestra, el procesamiento y análisis de la información —de carácter **cualitativo y descriptivo**—, las técnicas e instrumentos de recolección de datos, y un ejemplo de tabulación descriptiva de los resultados obtenidos en las entrevistas.

---

## Población y muestra

### Población

La población en la que se realizó la investigación estuvo conformada por **N = 183 personas** vinculadas a la gestión financiera y operativa de los ministerios de IECA. *(El respaldo demo del software tiene 182 usuarios de prueba; es un dataset distinto de la población de investigación.)* Como marco de referencia se utilizó el registro institucional **Lista de Líderes y Colaboradores IECA 2024** (*COLABORADORES DE CADA MINISTERIO 2024.xlsx*), integrado por colaboradores y líderes de **20 ministerios**, más el **administrador** y el **contable** del proceso financiero institucional.

**Características que tipifican a la población:** conocimiento del proceso contable ministerial; participación en el registro manual de ingresos y gastos; vínculo directo con aprobaciones, reportes o consulta de saldos por ministerio. No se incluyó a la feligresía en general por no participar en el proceso de gestión financiera analizado.

**Unidades de análisis** (diseño no experimental): administrador, contable y colaboradores de ministerio de IECA.

**Tabla 30. Población de colaboradores y líderes por ministerio — IECA 2024**

| Ministerio | N° colaboradores/líderes |
|------------|--------------------------|
| Alabanza | 29 |
| Ujieres | 29 |
| PGH | 24 |
| Pasitos a Cristo | 11 |
| Cadetes | 9 |
| E.S.F.C. | 9 |
| Danza | 7 |
| Oración (martes) | 7 |
| Parejas | 7 |
| Pastoral | 7 |
| Adolescentes | 6 |
| Consolidación | 6 |
| Caballeros | 6 |
| Discipulado | 4 |
| Jóvenes | 4 |
| Damas | 3 |
| Misiones | 3 |
| Oración (jueves) | 3 |
| Guardianía | 2 |
| Contabilidad | 1 |
| **Total registros** | **181** |

*Nota: Fuente — Lista de Líderes y Colaboradores IECA 2024, archivo institucional IECA.*

### Muestra

La población objetivo coincide con la población definida (**N = 183**). Para la obtención de información empírica —entrevistas, observación y revisión documental— se determinó un subconjunto mediante **muestreo intencional por criterio** (no probabilístico), seleccionando personas que representan cada rol dentro de la institución.

Para el cálculo de la muestra se utilizaron las fórmulas de la plantilla metodológica, sustituyendo el tamaño de población **N = 183** (181 colaboradores y líderes de ministerio, según Tabla 30, más 1 administrador y 1 contable) y manteniendo los siguientes parámetros:

- **P** = Probabilidad de éxito (0,50)
- **Q** = Probabilidad de fracaso (0,50)
- **N** = Tamaño de la población (183)
- **E** = Error de estimación (6 %)
- **K** = Número de desviación típica “Z” (2 → 95,5 %)

**Primer método**

n = P×Q×N / ((N−1) E²/K² + P×Q)

n = (0,50 × 0,50 × 183) / ((183−1) × 0,06² / 2² + 0,50 × 0,50)

n = 45,75 / ((182)(0,0036)/4 + 0,25)

n = 45,75 / ((0,6552)/4 + 0,25)

n = 45,75 / (0,1638 + 0,25)

n = 45,75 / 0,4138

**n ≈ 111**

**Segundo método**

n = N / (E² (N−1) + 1)

n = 183 / (0,06² × (183−1) + 1)

n = 183 / ((0,0036)(182) + 1)

n = 183 / (0,6552 + 1)

n = 183 / 1,6552

**n ≈ 111**

**Cálculo de la fracción muestral**

La fracción muestral indica qué proporción de la población total representa la muestra seleccionada.

**Fracción muestral teórica** (según fórmulas, n ≈ 111)

f = n/N

f = 111/183

f = **0,6066**

Es decir, la muestra teórica representaría el **60,66 %** de la población (N = 183).

**Fracción muestral aplicada** (muestra de trabajo, n = 5)

f = n/N

f = 5/183

f = **0,0273**

Es decir, la muestra aplicada representa el **2,73 %** de la población (N = 183).

*Comparación con la plantilla: f = 203/750 = 0,2707 (27,07 %). En el proyecto IECA, la fracción teórica es mayor porque N es más pequeña (183); la fracción aplicada (2,73 %) corresponde al muestreo intencional por rol (1 administrador, 1 contable y 3 colaboradores).*

**Tabla 31. Cálculo de la muestra**

| Estrato | Población | Muestra |
|---------|-----------|---------|
| Administrador IECA | 1 | 1 |
| Contable IECA | 1 | 1 |
| Colaboradores de ministerio | 181 | 3 |
| **Total** | **183** | **5** |

*Nota: Los estratos corresponden a los roles del proceso financiero de IECA (administrador, contable y colaboradores de ministerio), en sustitución de los estratos Alto/Medio/Bajo de la plantilla. La **población** (N = 183) se obtuvo del registro *Lista de Líderes y Colaboradores IECA 2024* (181 registros, Tabla 30) más el administrador y el contable institucional. La **muestra** (n = 5) se determinó mediante muestreo intencional por criterio: administrador y contable incluidos de forma censal (1 cada uno, por ser los únicos en su rol); tres colaboradores seleccionados por participar directamente en el registro de ingresos y gastos de ministerios con movimientos frecuentes. **Fuente:** investigación propia — IECA.*

---

## Procesamiento y análisis

El procesamiento de la información fue **manual** en la fase cualitativa: transcripción de entrevistas, codificación de respuestas, elaboración de cuadros de resumen y relación de los hallazgos con la problemática identificada. En la fase cuantitativa fue **mecánico**: tabulación de resultados y verificación del prototipo mediante pruebas de funcionamiento del sistema.

Para el análisis se empleó un enfoque **cualitativo y descriptivo**: codificación de respuestas de las entrevistas (n = 5) y tabulación con frecuencias absolutas y relativas sobre los resultados obtenidos; complementariamente, se registraron frecuencias sobre las pruebas aplicadas al prototipo (184 casos). Los resultados se presentaron en cuadros y gráficos de barras, interpretados en relación con la problemática, los objetivos del proyecto y las necesidades detectadas en el estudio.

El análisis e interpretación se realizó considerando el marco teórico y los objetivos de la investigación. El producto del análisis constituyó conclusiones parciales que sirvieron de insumo para las conclusiones y recomendaciones del proyecto.

---

## Técnicas e instrumentos de recolección de datos

| Técnica | Instrumento | Aspecto que evidencia |
|---------|-------------|------------------------|
| Entrevista semiestructurada | Guía de preguntas (Anexo) | Problemática y requerimientos |
| Observación | Registro de campo | Proceso manual actual |
| Revisión documental | Política y formatos contables IECA | Factibilidad y regla del 33 % |
| Prueba de aceptación | Casos CP-M01 a CP-M08 | Validación con usuarios |
| Prueba del prototipo | 184 casos de verificación | Funcionamiento del sistema |

Los instrumentos empleados (guía de entrevista y casos de prueba) se incorporan como anexos del proyecto.

---

## Ejemplo de análisis estadístico descriptivo

A continuación se presenta el análisis de la Pregunta 1 de la guía de entrevistas aplicada a los 5 informantes seleccionados (1 administrador, 1 contable y 3 colaboradores de ministerio).

**Pregunta 1:** ¿Cómo registra actualmente los ingresos y gastos de su ministerio?

**Tabla 32. Pregunta 1 — ¿Cómo registra actualmente los ingresos y gastos de su ministerio?**

| Opciones de respuesta | Frecuencia absoluta | Frecuencia relativa |
|-----------------------|---------------------|---------------------|
| En hojas o cuadernos | 3 | 60,00 % |
| Mensajes (WhatsApp) u otros medios informales | 2 | 40,00 % |
| Sistema digital integrado | 0 | 0,00 % |
| **TOTAL** | **5** | **100,00 %** |

*Nota: En esta tabla se muestran los valores absolutos y relativos correspondientes al proceso de tabulación de la Pregunta 1 aplicada en las entrevistas a los 5 informantes seleccionados para la investigación. Fuente: investigación propia — IECA.*

**Figura X. Pregunta 1: Análisis gráfico de la pregunta número 1 de la entrevista.**

*Nota: De un total de 5 entrevistados se observa que el 60,00 % registra en hojas o cuadernos y el 40,00 % en mensajes u otros medios informales; ninguno dispone de un sistema digital integrado. Fuente: investigación propia — IECA. (Insertar gráfico de barras en Word.)*

**Análisis:** Los resultados evidencian que el 100 % de la muestra utiliza métodos manuales o dispersos para el registro de movimientos financieros; ningún entrevistado cuenta con un sistema centralizado. Esto confirma la problemática de falta de trazabilidad y dificultad para calcular saldos y aportación iglesia, y sustenta la necesidad de un sistema con registro digital, flujo de aprobación, kardex por ministerio y reportes consolidados.

---

**Tabla 33. Resultados de pruebas del prototipo**

| Ámbito | Casos ejecutados | Casos superados | Frecuencia relativa |
|--------|------------------|-----------------|---------------------|
| Frontend | 117 | 117 | 100,00 % |
| Backend | 67 | 67 | 100,00 % |
| **Total** | **184** | **184** | **100,00 %** |

*Nota: Resultados de las pruebas de funcionamiento aplicadas al prototipo. Fuente: investigación propia — proyecto IECA.*

**Análisis:** El 100 % de las pruebas automatizadas fue superado (ejecución 17 jul 2026). Esto valida la propuesta desarrollada.

---

*Desarrollo del software: [METODOLOGIA.md](./METODOLOGIA.md).*
