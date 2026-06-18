"""Contenido de Entregables y Propuesta — scripts Word."""

HEADING_ENTREGABLES = "Entregables del proyecto"
HEADING_PROPUESTA = "Propuesta"

ENTREGABLES_INTRO = (
    "De acuerdo con la metodología en cascada (Waterfall) adoptada, los entregables del "
    "proyecto se generan de forma secuencial al cierre de cada fase. La Tabla 30 presenta "
    "la Estructura de Desglose del Trabajo (EDT) con los productos obtenidos."
)

TABLA_EDT_CAPTION = "Tabla 30. Estructura de desglose del trabajo (EDT) — proyecto IECA"

TABLA_EDT = [
    ["Nivel", "Entregable", "Fase", "Formato / ubicación"],
    ["1", "Sistema Web de Gestión Financiera IECA", "—", "Producto final"],
    ["1.1", "Especificación de requisitos (RF, RNF y 18 casos de uso)", "Análisis", "Capítulo 3"],
    ["1.2", "Diagramas del sistema (arquitectura, clases, estados, casos de uso)", "Diseño", "Capítulo 3 y anexos"],
    ["1.3", "Modelo de base de datos Firestore", "Diseño", "Capítulo 3 — Base de datos"],
    ["1.4", "Código fuente frontend", "Implementación", "Repositorio src/ (Angular 20 + Ionic 8)"],
    ["1.5", "Código fuente backend", "Implementación", "Repositorio server/src/ (Node.js + Express 5)"],
    ["1.6", "Código ejecutable en producción", "Despliegue", "Firebase Hosting + Render"],
    ["1.7", "Informe de pruebas", "Verificación", "Tablas 22 a 26 del capítulo"],
    ["1.8", "Manual de instalación y operación", "Despliegue", "docs/DEPLOY.md"],
    ["1.9", "Documentación técnica y manual de usuario", "Documentación", "README.md y carpeta docs/"],
    ["1.10", "Respaldo JSON de demostración", "Documentación", "docs/backup-demo-ieca.json"],
]

PROPUESTA_PARAGRAPHS = [
    (
        "La propuesta consiste en un Sistema Web de Gestión Financiera para la Iglesia "
        "Evangélica La Alborada (IECA), orientado al uso en navegador de escritorio por "
        "administradores, contables y colaboradores de ministerio."
    ),
    (
        "La solución se estructura en tres capas: presentación (Angular 20 e Ionic 8), "
        "aplicación (Node.js y Express 5 con API REST) y datos (Firebase Firestore). "
        "La seguridad se gestiona con JWT, roles y validación de entrada."
    ),
    (
        "El sistema agrupa cuatro módulos funcionales: Seguridad y Acceso, Gestión "
        "Financiera y Flujo de Caja, Reportes y Analítica, y Administración del Sistema. "
        "Permite registrar ingresos y gastos por ministerio, aprobar movimientos, calcular "
        "la aportación iglesia del 33 % en ingresos de talento (cuenta 4105), generar "
        "reportes con kardex y exportar Excel."
    ),
    (
        "El prototipo está construido y desplegado en Firebase Hosting y Render. Su "
        "funcionamiento se evidencia en el caso del ingreso #13 (ministerio Alabanza y "
        "Adoración, $182,00, saldo final en kardex $41,94) y en las 95 pruebas "
        "automatizadas más 8 casos manuales de aceptación."
    ),
]
