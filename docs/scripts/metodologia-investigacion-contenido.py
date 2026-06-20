"""Metodología de investigación — contenido adaptado a plantilla universidad (proyecto IECA)."""

METODOLOGIAS_PROYECTO_HEADING = "Metodologías del proyecto"
METODOLOGIAS_PROYECTO = [
    (
        "El proyecto aplica dos metodologías complementarias: una de investigación "
        "(enfoque cualitativo, tipo aplicada, alcance diagnóstico y descriptivo) para "
        "identificar la problemática, la factibilidad y los requerimientos del sistema "
        "financiero de IECA; y una de desarrollo en modelo cascada (Waterfall), para "
        "construir y validar el prototipo web de forma secuencial."
    ),
    (
        "En este capítulo se desarrollan ambas: la metodología de investigación "
        "(población, muestra, recolección y análisis de datos) y la metodología de "
        "desarrollo y verificación (fases, entregables, plan de calidad, cronograma y "
        "pruebas del sistema)."
    ),
]

HEADING = "Metodología de investigación"

PARAGRAPHS = [
    (
        "Para una propuesta tecnológica como el Sistema Web de Gestión Financiera de la "
        "Iglesia Evangélica La Alborada (IECA), se aplicó una investigación que permitió "
        "explorar y diagnosticar el problema de estudio: el registro manual y disperso de "
        "ingresos y gastos por ministerio, la falta de trazabilidad en las aprobaciones y "
        "la dificultad para calcular saldos y la aportación iglesia del 33 %."
    ),
    (
        "La investigación se desarrolló bajo un enfoque cualitativo, con tipo aplicada, "
        "alcance diagnóstico y descriptivo y diseño no experimental. Se empleó muestreo "
        "no probabilístico por criterio (intencional) y, como técnicas de recolección de "
        "información, la entrevista semiestructurada, la observación del proceso actual y "
        "la revisión documental. Mediante estas técnicas se evidenciaron la problemática, "
        "la factibilidad y los requerimientos del sistema propuesto, a partir de una muestra "
        "de n = 5 personas (1 administrador, 1 contable y 3 colaboradores de ministerio). "
        "El cálculo muestral teórico (n ≈ 111) se incluye más adelante como referencia "
        "metodológica conforme a la plantilla institucional."
    ),
    (
        "En esta sección se presentan la población y muestra, el procesamiento y análisis "
        "de la información —de carácter cualitativo y descriptivo—, las técnicas e "
        "instrumentos de recolección de datos, y un ejemplo de tabulación descriptiva de "
        "los resultados obtenidos en las entrevistas."
    ),
]

POBLACION_TITLE = "Población y muestra"
POBLACION = (
    "**Población.** La población en la que se realizó la investigación estuvo conformada por "
    "**N = 183 personas** vinculadas a la gestión financiera y operativa de los ministerios "
    "de IECA. Como marco de referencia se utilizó el registro institucional Lista de Líderes "
    "y Colaboradores IECA 2024 (COLABORADORES DE CADA MINISTERIO 2024.xlsx), integrado por "
    "colaboradores y líderes de **20 ministerios**, más el **administrador** y el **contable** "
    "del proceso financiero institucional. Características: conocimiento del proceso contable "
    "ministerial, participación en registros manuales y vínculo con aprobaciones o reportes. "
    "Unidades de análisis: administrador, contable y colaboradores de ministerio (diseño no "
    "experimental). No se incluyó a la feligresía en general."
)

TABLA_POBLACION_CAPTION = (
    "Tabla 30. Población de colaboradores y líderes por ministerio — IECA 2024"
)
TABLA_POBLACION = [
    ["Ministerio", "N° colaboradores/líderes"],
    ["Alabanza", "29"],
    ["Ujieres", "29"],
    ["PGH", "24"],
    ["Pasitos a Cristo", "11"],
    ["Cadetes", "9"],
    ["E.S.F.C.", "9"],
    ["Danza", "7"],
    ["Oración (martes)", "7"],
    ["Parejas", "7"],
    ["Pastoral", "7"],
    ["Adolescentes", "6"],
    ["Consolidación", "6"],
    ["Caballeros", "6"],
    ["Discipulado", "4"],
    ["Jóvenes", "4"],
    ["Damas", "3"],
    ["Misiones", "3"],
    ["Oración (jueves)", "3"],
    ["Guardianía", "2"],
    ["Contabilidad", "1"],
    ["Total registros", "181"],
]

NOTA_POBLACION = (
    "Fuente: Lista de Líderes y Colaboradores IECA 2024 — archivo institucional IECA."
)

MUESTRA_INTRO = (
    "**Muestra.** La población objetivo coincide con la población definida (N = 183). Para la "
    "obtención de información empírica —entrevistas, observación y revisión documental— "
    "se determinó un subconjunto mediante muestreo intencional por criterio (no "
    "probabilístico), seleccionando personas que representan cada rol dentro de la institución."
)

MUESTRA_PARAMS = (
    "Para el cálculo de la muestra se utilizaron las fórmulas de la plantilla metodológica, "
    "sustituyendo N = 183 (181 colaboradores y líderes de ministerio, según Tabla 30, más "
    "1 administrador y 1 contable) con: P = 0,50; Q = 0,50; E = 6 %; K = 2 (95,5 %)."
)

MUESTRA_FORMULA = [
    "Primer método",
    "n = P×Q×N / ((N−1) E²/K² + P×Q)",
    "n = (0,50 × 0,50 × 183) / ((183−1) × 0,06² / 2² + 0,50 × 0,50)",
    "n = 45,75 / ((182)(0,0036)/4 + 0,25)",
    "n = 45,75 / ((0,6552)/4 + 0,25)",
    "n = 45,75 / (0,1638 + 0,25)",
    "n = 45,75 / 0,4138",
    "n ≈ 111",
    "Segundo método",
    "n = N / (E² (N−1) + 1)",
    "n = 183 / (0,06² × (183−1) + 1)",
    "n = 183 / ((0,0036)(182) + 1)",
    "n = 183 / (0,6552 + 1)",
    "n = 183 / 1,6552",
    "n ≈ 111",
]

MUESTRA_FRACCION = [
    "Cálculo de la fracción muestral",
    "La fracción muestral indica qué proporción de la población total representa la muestra seleccionada.",
    "Fracción muestral teórica (según fórmulas, n ≈ 111)",
    "f = n/N",
    "f = 111/183",
    "f = 0,6066 (60,66 % de la población N = 183).",
    "Fracción muestral aplicada (muestra de trabajo, n = 5)",
    "f = n/N",
    "f = 5/183",
    "f = 0,0273 (2,73 % de la población N = 183).",
]

MUESTRA_APLICADA = (
    "Para la aplicación de los instrumentos de recolección de datos se trabajó con una "
    "muestra de n = 5 personas: 1 administrador, 1 contable y 3 colaboradores de ministerios "
    "con movimientos financieros frecuentes. Los roles de administrador y contable se "
    "incluyeron de forma censal; los colaboradores fueron seleccionados según su participación "
    "directa en el registro de ingresos y gastos."
)

MUESTRA = MUESTRA_INTRO

TABLA_MUESTRA_CAPTION = "Tabla 31. Cálculo de la muestra"
TABLA_MUESTRA = [
    ["Estrato", "Población", "Muestra"],
    ["Administrador IECA", "1", "1"],
    ["Contable IECA", "1", "1"],
    ["Colaboradores de ministerio", "181", "3"],
    ["Total", "183", "5"],
]

NOTA_MUESTRA = (
    "Nota: Los estratos corresponden a los roles del proceso financiero de IECA "
    "(administrador, contable y colaboradores de ministerio). La población (N = 183) se "
    "obtuvo del registro Lista de Líderes y Colaboradores IECA 2024 (181 registros, Tabla 30) "
    "más el administrador y el contable institucional. La muestra (n = 5) se determinó mediante "
    "muestreo intencional por criterio: administrador y contable censales (1 cada uno); tres "
    "colaboradores de ministerios con movimientos frecuentes. Fuente: investigación propia — IECA."
)

PROCESAMIENTO_TITLE = "Procesamiento y análisis"
PROCESAMIENTO = [
    (
        "El procesamiento de la información fue manual en la fase cualitativa: transcripción "
        "de entrevistas, codificación de respuestas, elaboración de cuadros de resumen y "
        "relación de los hallazgos con la problemática identificada. En la fase cuantitativa "
        "fue mecánico: tabulación de resultados y verificación del prototipo mediante pruebas "
        "de funcionamiento del sistema."
    ),
    (
        "Para el análisis se empleó un enfoque cualitativo y descriptivo: codificación de "
        "respuestas de las entrevistas (n = 5) y tabulación con frecuencias absolutas y "
        "relativas; complementariamente, se registraron frecuencias sobre las pruebas "
        "aplicadas al prototipo (95 casos). Los resultados se presentaron en cuadros y "
        "gráficos de barras, interpretados en relación con la problemática y los objetivos "
        "del proyecto."
    ),
]

TECNICAS_TITLE = "Técnicas e instrumentos de recolección de datos"
TECNICAS = [
    ["Técnica", "Instrumento", "Aspecto que evidencia"],
    ["Entrevista semiestructurada", "Guía de preguntas (Anexo)", "Problemática y requerimientos"],
    ["Observación", "Registro de campo", "Proceso manual actual"],
    ["Revisión documental", "Política y formatos contables", "Factibilidad y regla 33 %"],
    ["Prueba de aceptación", "Casos CP-M01 a CP-M08", "Validación con usuarios"],
    ["Prueba del prototipo", "95 casos de verificación", "Funcionamiento del sistema"],
]

PREGUNTA_EJEMPLO = "Pregunta 1: ¿Cómo registra actualmente los ingresos y gastos de su ministerio?"
TABLA_PREGUNTA_CAPTION = (
    "Tabla 32. Pregunta 1 — ¿Cómo registra actualmente los ingresos y gastos de su ministerio?"
)
TABLA_PREGUNTA = [
    ["Opciones de respuesta", "Frecuencia absoluta", "Frecuencia relativa"],
    ["En hojas o cuadernos", "3", "60,00 %"],
    ["Mensajes (WhatsApp) u otros medios informales", "2", "40,00 %"],
    ["Sistema digital integrado", "0", "0,00 %"],
    ["TOTAL", "5", "100,00 %"],
]

FIGURA_EJEMPLO = (
    "Figura X. Pregunta 1: Análisis gráfico de la pregunta número 1 de la entrevista.\n"
    "Nota: De 5 entrevistados, el 60 % registra en papel y el 40 % en medios informales; "
    "ninguno dispone de un sistema integrado. Fuente: investigación propia — IECA."
)

ANALISIS_PREGUNTA = (
    "Análisis: El 100 % de la muestra utiliza métodos manuales o dispersos; ningún "
    "entrevistado cuenta con un sistema centralizado. Esto confirma la problemática de "
    "falta de trazabilidad y dificultad para calcular saldos y aportación iglesia, y "
    "sustenta la necesidad de un sistema con registro digital, flujo de aprobación, kardex "
    "y reportes consolidados."
)

TABLA_PRUEBAS_CAPTION = "Tabla 33. Resultados de pruebas del prototipo"
TABLA_PRUEBAS = [
    ["Ámbito", "Casos ejecutados", "Casos superados", "Frecuencia relativa"],
    ["Frontend", "46", "46", "100,00 %"],
    ["Backend", "49", "48", "97,96 %"],
    ["Total", "95", "94", "98,95 %"],
]

ANALISIS_PRUEBAS = (
    "Análisis: El 98,95 % de las pruebas fue superado. El único caso pendiente corresponde "
    "al envío de alertas por correo en entorno local, sin impacto en el funcionamiento "
    "general del sistema. Esto valida la propuesta desarrollada."
)
