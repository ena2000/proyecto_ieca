"""Metodología de investigación — contenido adaptado a plantilla universidad (proyecto IECA)."""

HEADING = "Metodología de investigación"

PARAGRAPHS = [
    (
        "Para una propuesta tecnológica como el Sistema Web de Gestión Financiera de IECA, "
        "se aplicó una metodología de investigación que permitió explorar y diagnosticar la "
        "problemática de estudio: el registro manual y disperso de ingresos y gastos por "
        "ministerio, la falta de trazabilidad en aprobaciones y la dificultad para calcular "
        "saldos y la aportación iglesia del 33 %."
    ),
    (
        "La metodología empleada es de tipo **diagnóstica y descriptiva**, con diseño "
        "**no experimental**, basada en **ingeniería de requisitos**. No se realizó una "
        "investigación de campo con muestreo probabilístico ni encuesta masiva (como la "
        "contemplada en la plantilla con fórmula n = 203), porque el trabajo corresponde a "
        "un proyecto de desarrollo tecnológico cuyo fin es construir y validar un prototipo "
        "informático, no inferir estadísticamente sobre una población de 750 individuos."
    ),
    (
        "**Justificación:** la recolección de información se sustituyó por ingeniería de "
        "requerimientos: entrevistas semiestructuradas, observación del proceso actual y "
        "revisión documental, orientadas a evidenciar la **problemática**, la **factibilidad** "
        "y los **requerimientos** del sistema (RF, RNF y casos de uso), conforme indicó el "
        "criterio académico para propuestas tecnológicas."
    ),
]

POBLACION_TITLE = "Población y muestra"
POBLACION = (
    "**Población.** La población objetivo estuvo conformada por las personas vinculadas a la "
    "gestión financiera de la Iglesia Evangélica La Alborada (IECA): administrador, contable "
    "y colaboradores de ministerio que registran, aprueban o consultan movimientos. Se "
    "estima entre **8 y 12 personas** con rol operativo. Características: conocimiento del "
    "proceso contable institucional, uso de registros manuales previos y participación en "
    "aprobaciones o reportes. Unidades de análisis: **stakeholders del proceso financiero** "
    "(diseño no experimental). No se incluyó a la feligresía en general por no operar el sistema."
)
MUESTRA = (
    "**Muestra.** Se empleó **muestreo intencional por criterio** (no probabilístico), "
    "seleccionando actores que representan cada rol del sistema. **No se aplicó la fórmula "
    "n = P×Q×N/(…)** ni estratos Alto/Medio/Bajo de la plantilla, porque la población N es "
    "acotada y conocida; la muestra busca **cobertura de roles**, no representatividad "
    "estadística de 750 sujetos. Total entrevistados/validadores: **5 personas** "
    "(1 administrador, 1 contable, 3 colaboradores de ministerio)."
)

TABLA_MUESTRA_CAPTION = "Tabla 31. Determinación de la muestra por rol — proyecto IECA"
TABLA_MUESTRA = [
    ["Rol / estrato", "Población (aprox.)", "Muestra", "Criterio de selección"],
    ["Administrador IECA", "1", "1", "Único responsable de aprobaciones y cierre"],
    ["Contable IECA", "1", "1", "Responsable de reportes y conciliación"],
    ["Colaboradores de ministerio", "6–10", "3", "Ministerios con movimientos frecuentes"],
    ["Total", "8–12", "5", "Muestreo intencional por rol"],
]

NOTA_MUESTRA = (
    "Nota: La fracción muestral f = n/N no se calculó con la plantilla de 750/203, "
    "por ser una población institucional reducida. Fuentes: entrevistas propias, "
    "observación del proceso y documentación contable de IECA."
)

PROCESAMIENTO_TITLE = "Procesamiento y análisis"
PROCESAMIENTO = [
    (
        "El procesamiento de la información fue **manual y documental** en la fase cualitativa "
        "(transcripción de entrevistas, matriz problemática–requisito) y **mecánico** en la "
        "fase cuantitativa (ejecución automatizada de pruebas con Karma/Jasmine, Node test "
        "runner y GitHub Actions)."
    ),
    (
        "No se aplicó **minería de datos**, regresión, clustering ni redes neuronales, "
        "porque no se dispuso de un volumen masivo de encuestas. El análisis estadístico "
        "descriptivo se aplicó a los **resultados de pruebas del prototipo** (frecuencias "
        "absolutas y relativas de casos superados), conforme a los objetivos del proyecto "
        "tecnológico."
    ),
]

TECNICAS_TITLE = "Técnicas e instrumentos de recolección de datos"
TECNICAS = [
    ["Técnica", "Instrumento", "Aspecto que evidencia"],
    ["Entrevista semiestructurada", "Guía de preguntas (Anexo)", "Problemática y requisitos"],
    ["Observación", "Registro de campo", "Proceso manual actual"],
    ["Revisión documental", "Formatos y política contable", "Factibilidad y regla 33 %"],
    ["Prueba de aceptación", "Casos CP-M01 a CP-M08", "Validación con usuarios"],
    ["Prueba automatizada", "95 casos en CI", "Verificación técnica"],
]

PREGUNTA_EJEMPLO = "Pregunta 1: ¿Cómo registra actualmente los ingresos y gastos de su ministerio?"
TABLA_PREGUNTA_CAPTION = "Tabla 32. Pregunta 1 — Resultados de entrevistas (n = 5)"
TABLA_PREGUNTA = [
    ["Opción de respuesta", "Frecuencia absoluta", "Frecuencia relativa"],
    ["En hojas o cuadernos", "3", "60,00 %"],
    ["Mensajes (WhatsApp) u otros medios informales", "2", "40,00 %"],
    ["Sistema digital integrado", "0", "0,00 %"],
    ["TOTAL", "5", "100,00 %"],
]

FIGURA_EJEMPLO = (
    "Figura X. Análisis gráfico de la Pregunta 1 (registro actual de movimientos).\n"
    "Nota: Inserte gráfico de barras. De 5 entrevistados, el 60 % registra en papel y el "
    "40 % en medios informales; ninguno dispone de un sistema integrado, lo que justifica "
    "el prototipo web propuesto. Fuente: investigación propia — IECA."
)

ANALISIS_PREGUNTA = (
    "Análisis: Los resultados evidencian que el 100 % de la muestra utiliza métodos "
    "manuales o dispersos, sin un sistema centralizado. Esto confirma la problemática "
    "de falta de trazabilidad y dificultad para calcular saldos y aportación iglesia, "
    "y sustenta los requisitos de registro digital, flujo de aprobación, kardex y reportes "
    "consolidados del sistema IECA."
)

TABLA_PRUEBAS_CAPTION = "Tabla 33. Resultados de pruebas automatizadas del prototipo"
TABLA_PRUEBAS = [
    ["Ámbito", "Casos ejecutados", "Casos superados", "Frecuencia relativa"],
    ["Frontend", "46", "46", "100,00 %"],
    ["Backend", "49", "48", "97,96 %"],
    ["Total", "95", "94", "98,95 %"],
]

ANALISIS_PRUEBAS = (
    "Análisis: El 98,95 % de las pruebas automatizadas fue superado. El único caso "
    "pendiente corresponde al envío de alertas por SMTP sin credenciales en entorno local, "
    "sin impacto en la lógica de negocio. Esto valida técnicamente la propuesta desarrollada."
)
