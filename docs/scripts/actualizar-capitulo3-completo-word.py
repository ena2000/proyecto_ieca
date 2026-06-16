"""
Actualiza CAPITULO 3 - ENTENDERLO.docx:
- Tabla de casos de uso (18, 4 módulos, con actores)
- Sección desde punto 7 (plan calidad, cronograma, verificación)
"""
from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Pt

DOC_PATH = Path(r"c:\Users\ena\Desktop\TITULACION\CAPITULO 3 - ENTENDERLO.docx")
TABLE_INDEX = 2

M1 = "Seguridad y Acceso (Autenticación)"
M2 = "Gestión Financiera y Flujo de Caja"
M3 = "Reportes y Analítica"
M4 = "Administración del Sistema y Soporte"

CASOS_USO = [
    ("CU-01", "Iniciar sesión", M1, "Administrador, Contable, Colaborador", "Login con JWT y carga inicial de datos"),
    ("CU-02", "Recuperar contraseña", M1, "Administrador, Contable, Colaborador", "Código por correo y restablecimiento"),
    ("CU-03", "Cambiar contraseña", M1, "Administrador, Contable, Colaborador", "Cambio obligatorio en primer acceso"),
    ("CU-04", "Registrar ingreso", M2, "Colaborador, Administrador", "Alta con comprobante; queda pendiente si es colaborador"),
    ("CU-05", "Registrar gasto", M2, "Colaborador, Administrador", "Alta con comprobante; queda pendiente si es colaborador"),
    ("CU-06", "Aprobar movimiento", M2, "Administrador", "Aprueba ingreso o gasto; genera aportación 33% si es talento"),
    ("CU-07", "Rechazar movimiento", M2, "Administrador", "Rechaza con motivo"),
    ("CU-08", "Consultar dashboard", M3, "Administrador, Contable, Colaborador", "KPIs y gráficos con movimientos aprobados"),
    ("CU-09", "Generar reportes", M3, "Administrador, Contable, Colaborador", "Filtros, desglose, kardex y exportación Excel"),
    ("CU-10", "Gestionar ministerios", M4, "Administrador", "CRUD, saldo disponible y kardex"),
    ("CU-11", "Gestionar usuarios", M4, "Administrador", "CRUD con roles y asignación de ministerio"),
    ("CU-12", "Ejecutar cierre mensual", M4, "Administrador", "Cierra periodo y bloquea movimientos del mes"),
    ("CU-13", "Backup y restauración", M4, "Administrador", "Exportar e importar respaldo JSON"),
    ("CU-14", "Consultar auditoría", M4, "Administrador", "Historial de movimientos y exportación CSV"),
    ("CU-15", "Enviar alertas por correo", M4, "Administrador", "Pendientes antiguos y aviso de cierre"),
    ("CU-16", "Consultar notificaciones", M1, "Administrador, Contable, Colaborador", "Ver y marcar alertas en la interfaz"),
    ("CU-17", "Consultar movimientos generales", M2, "Contable", "Consulta de ingresos y gastos en modo solo lectura"),
    ("CU-18", "Consultar mis movimientos", M2, "Colaborador", "Consulta de movimientos de su ministerio"),
]

MODULOS_BULLETS = [
    "1. Seguridad y Acceso (Autenticación) — Actores: Administrador, Contable, Colaborador — CU-01, CU-02, CU-03, CU-16",
    "2. Gestión Financiera y Flujo de Caja — Actores: Colaborador, Administrador, Contable — CU-04, CU-05, CU-06, CU-07, CU-17, CU-18",
    "3. Reportes y Analítica — Actores: Administrador, Contable, Colaborador — CU-08, CU-09",
    "4. Administración del Sistema y Soporte — Actor: Administrador — CU-10 a CU-15",
]


def set_run_font(run, bold: bool = False, size: float = 10) -> None:
    run.bold = bold
    run.font.name = "Calibri"
    run.font.size = Pt(size)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")


def set_cell_text(cell, text: str, bold: bool = False, size: float = 9) -> None:
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    set_run_font(p.add_run(text), bold=bold, size=size)


def ensure_row_count(table, needed_rows: int) -> None:
    while len(table.rows) < needed_rows:
        table.add_row()
    while len(table.rows) > needed_rows:
        table._tbl.remove(table.rows[-1]._tr)


def update_use_cases_table(doc: Document) -> None:
    table = doc.tables[TABLE_INDEX]
    headers = ["ID", "Caso de uso", "Módulo", "Actor principal", "Descripción breve"]
    needed = 1 + len(CASOS_USO)
    ensure_row_count(table, needed)
    for col, header in enumerate(headers):
        set_cell_text(table.rows[0].cells[col], header, bold=True, size=10)
    for row_idx, caso in enumerate(CASOS_USO, start=1):
        for col, value in enumerate(caso):
            set_cell_text(table.rows[row_idx].cells[col], value)


def update_module_bullets(doc: Document) -> None:
    org_para = None
    bullet_paras = []
    collecting = False
    for para in doc.paragraphs:
        if "Organización por módulos" in para.text:
            org_para = para
            collecting = True
            continue
        if collecting:
            t = para.text.strip()
            if t.startswith("Figura"):
                break
            if t and t[0].isdigit() and "CU-" in t:
                bullet_paras.append(para)
    if not org_para:
        return
    for p in bullet_paras:
        p._element.getparent().remove(p._element)
    ref = org_para._element
    for bullet in MODULOS_BULLETS:
        new_p = doc.add_paragraph(bullet, style="List Bullet")
        ref.addnext(new_p._element)
        ref = new_p._element


def add_heading(doc: Document, text: str, level: int = 2) -> None:
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        set_run_font(run, bold=True, size=14 if level == 2 else 12)


def add_para(doc: Document, text: str, bold: bool = False) -> None:
    p = doc.add_paragraph()
    set_run_font(p.add_run(text), bold=bold, size=11)


def add_table(doc: Document, headers: list[str], rows: list[list[str]]) -> None:
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    for c, h in enumerate(headers):
        set_cell_text(table.rows[0].cells[c], h, bold=True, size=10)
    for r, row in enumerate(rows, start=1):
        for c, val in enumerate(row):
            set_cell_text(table.rows[r].cells[c], val)
    doc.add_paragraph()


def remove_existing_metodologia(doc: Document) -> None:
    start = None
    for i, p in enumerate(doc.paragraphs):
        if p.text.strip() == "Metodología de desarrollo y verificación":
            start = i
            break
    if start is None:
        return
    for i in range(len(doc.paragraphs) - 1, start - 1, -1):
        doc.paragraphs[i]._element.getparent().remove(doc.paragraphs[i]._element)
    while len(doc.tables) > 3:
        doc.tables[-1]._tbl.getparent().remove(doc.tables[-1]._tbl)


def append_point7_sections(doc: Document) -> None:
    add_heading(doc, "Metodología de desarrollo y verificación", level=2)

    add_heading(doc, "7. Plan de calidad (pruebas a realizar)", level=3)
    add_para(
        doc,
        "El plan de calidad define las pruebas y criterios de aceptación para verificar "
        "que el sistema cumple los requisitos funcionales y no funcionales de IECA.",
    )
    add_para(doc, "Tabla 19. Plan de calidad — pruebas a realizar", bold=True)
    add_table(
        doc,
        ["Tipo de prueba", "Herramienta", "Ámbito", "Criterio de aceptación"],
        [
            ("Unitarias frontend", "Karma + Jasmine", "Utilidades, servicios y componentes", "46 casos en verde"),
            ("Unitarias backend", "Node test runner", "JWT, cierre, unicidad, schemas Zod", "49 casos (48 pass)"),
            ("Integración HTTP", "Supertest", "Endpoints de la API", "12 casos en integración"),
            ("Manuales por rol", "Navegador de escritorio", "Flujos admin, contable y colaborador", "8 casos verificados"),
            ("Integración continua", "GitHub Actions", "Lint, tests y build", "CI en cada cambio"),
        ],
    )
    add_para(doc, "Tabla 20. Actividades de calidad por fase", bold=True)
    add_table(
        doc,
        ["Actividad", "Momento", "Responsable", "Criterio de aceptación"],
        [
            ("Revisión de requisitos", "Fase 1", "Admin / contable IECA", "Requisitos validados"),
            ("Revisión de diseño", "Fase 2", "Desarrolladora", "Coherencia con requisitos"),
            ("Estándares de código", "Fase 3", "Desarrolladora", "ESLint y TypeScript sin errores"),
            ("Pruebas automatizadas", "Fase 4", "Desarrolladora + CI", "95 casos ejecutados"),
            ("Pruebas manuales", "Fase 4", "Stakeholders IECA", "Flujos críticos verificados"),
            ("Checklist de despliegue", "Fase 5", "Desarrolladora", "Health check OK"),
        ],
    )

    add_heading(doc, "8. Cronograma de actividades (etapas desarrolladas)", level=3)
    add_para(
        doc,
        "El cronograma refleja las etapas desarrolladas del proyecto, alineadas con el "
        "modelo en cascada y el archivo Gantt del proyecto de titulación (GanttProject).",
    )
    add_para(doc, "Figura X. Cronograma de actividades del proyecto IECA", bold=True)
    add_para(doc, "Nota: Inserte aquí la imagen exportada desde GanttProject (Untitled Project 1.gan).")
    add_para(doc, "Tabla 21. Cronograma de etapas desarrolladas", bold=True)
    add_table(
        doc,
        ["#", "Etapa", "Fechas", "Entregable", "Estado"],
        [
            ("1", "Análisis de requisitos", "09 abr – 18 abr 2026", "Especificación de requisitos", "Completado"),
            ("2", "Diseño de arquitectura", "19 abr – 28 abr 2026", "Diagramas de arquitectura", "Completado"),
            ("3", "Diseño de base de datos", "29 abr – 10 may 2026", "Modelo Firestore", "Completado"),
            ("4", "Desarrollo Backend", "11 may – 25 jun 2026", "Código server/src/", "Completado"),
            ("5", "Desarrollo Frontend", "11 may – 25 jun 2026", "Código src/app/", "Completado"),
            ("6", "Pruebas unitarias", "26 jun – 03 jul 2026", "Informe de pruebas", "Completado"),
            ("7", "Pruebas de usabilidad", "04 jul – 08 jul 2026", "Validación por rol", "Completado"),
            ("8", "Revisión y entrega final", "09 jul – 15 jul 2026", "Sistema en producción", "En curso"),
            ("9", "Redacción de tesis", "19 abr – 10 jul 2026", "Documento de titulación", "En curso"),
        ],
    )
    add_para(
        doc,
        "Dependencias: Análisis → Diseño → Implementación (backend y frontend en paralelo) "
        "→ Pruebas → Revisión y entrega. La redacción de la tesis transcurre en paralelo desde la fase de diseño.",
    )

    add_heading(doc, "Verificación: casos de prueba con resultados", level=3)
    add_para(
        doc,
        "Las estrategias de verificación y validación del prototipo se basaron en pruebas "
        "unitarias, pruebas de integración, pruebas de reglas de negocio y pruebas de "
        "aceptación con usuarios institucionales.",
    )
    add_para(doc, "Pruebas unitarias", bold=True)
    add_para(doc, "Ejecutadas con Karma + Jasmine (frontend) y Node.js test runner (backend). Resultados del 15 de junio de 2026:")
    add_para(doc, "Tabla 22. Resumen de pruebas automatizadas", bold=True)
    add_table(
        doc,
        ["Ámbito", "Casos", "Herramienta", "Resultado"],
        [
            ("Frontend", "46", "Karma + Jasmine + ChromeHeadless", "46/46 SUCCESS (3,33 s)"),
            ("Backend", "49", "Node test runner + Supertest", "48/49 pass"),
            ("Total", "95", "GitHub Actions (CI)", "94 pass + 1 condicional (SMTP)"),
        ],
    )
    add_para(doc, "Nota: El caso POST /api/admin/alertas/enviar requiere SMTP configurado en local; no afecta la lógica de negocio.")
    add_para(doc, "Tabla 23. Resultados detallados — frontend", bold=True)
    add_table(
        doc,
        ["Archivo de prueba", "Casos", "Estado"],
        [
            ("aportacion-iglesia.util.spec.ts", "8", "OK"),
            ("movimiento-filtros.util.spec.ts", "6", "OK"),
            ("movimiento-responsable.util.spec.ts", "4", "OK"),
            ("reportes-filtros.util.spec.ts", "5", "OK"),
            ("unicidad.util.spec.ts", "3", "OK"),
            ("data.service.spec.ts", "4", "OK"),
            ("Componentes (login, ingresos, gastos, reportes…)", "16", "OK"),
            ("Total", "46", "SUCCESS"),
        ],
    )
    add_para(doc, "Tabla 24. Resultados detallados — backend", bold=True)
    add_table(
        doc,
        ["Suite", "Casos", "Estado"],
        [
            ("auth.schema (Zod)", "4", "OK"),
            ("signToken / JWT", "4", "OK"),
            ("requireRoles", "2", "OK"),
            ("cierre-mensual", "3", "OK"),
            ("email-templates", "4", "OK"),
            ("getProductionConfigErrors", "6", "OK"),
            ("API HTTP (integración)", "12", "11 OK, 1 SMTP"),
            ("resumen-operativo", "4", "OK"),
            ("unicidad y otros", "10", "OK"),
            ("Total", "49", "48 pass"),
        ],
    )
    add_para(doc, "Pruebas de integración", bold=True)
    add_para(doc, "Se ejecutaron con Supertest sobre la API Express, usando Firestore en memoria.")
    add_para(doc, "Tabla 25. Pruebas de integración HTTP", bold=True)
    add_table(
        doc,
        ["Endpoint", "Método", "Resultado esperado", "Estado"],
        [
            ("/api/health", "GET", "200 OK", "Superado"),
            ("/api/auth/login", "POST", "Token JWT válido", "Superado"),
            ("/api/auth/refresh", "POST", "Renueva tokens", "Superado"),
            ("/api/ingresos", "GET", "401 sin token", "Superado"),
            ("/api/admin/cierre", "POST", "Cierra periodo", "Superado"),
        ],
    )
    add_para(doc, "Pruebas de reglas de negocio", bold=True)
    add_table(
        doc,
        ["Regla", "Verificación", "Resultado"],
        [
            ("Aportación 33% solo en talento (4105)", "aportacion-iglesia.util.spec.ts", "Superado"),
            ("Solo administrador aprueba movimientos", "Prueba HTTP + manual", "Superado"),
            ("Periodo cerrado bloquea edición", "cierre-mensual.test.js", "Superado"),
            ("Kardex coherente con movimientos", "CP-M07 manual", "Superado"),
            ("Bootstrap carga datos por rol", "http.integration.test.js", "Superado"),
        ],
    )
    add_para(doc, "Pruebas de aceptación con usuarios institucionales", bold=True)
    add_para(doc, "Tabla 26. Casos de prueba manuales", bold=True)
    add_table(
        doc,
        ["ID", "Caso", "Actor", "Estado"],
        [
            ("CP-M01", "Login y acceso al dashboard", "Todos", "Verificado"),
            ("CP-M02", "Colaborador registra ingreso pendiente", "Colaborador", "Verificado"),
            ("CP-M03", "Admin aprueba ingreso talento → 33%", "Administrador", "Verificado"),
            ("CP-M04", "Contable consulta reportes sin aprobar", "Contable", "Verificado"),
            ("CP-M05", "Cierre mensual bloquea edición", "Administrador", "Verificado"),
            ("CP-M06", "Exportar Excel con kardex", "Admin / Contable", "Verificado"),
            ("CP-M07", "Kardex coherente con movimientos", "Administrador", "Verificado"),
            ("CP-M08", "Bootstrap carga datos tras login", "Todos", "Verificado"),
        ],
    )
    add_para(doc, "Conclusión de verificación", bold=True)
    add_para(
        doc,
        "El sistema superó 46 pruebas unitarias frontend, 48 de 49 pruebas backend y 8 casos "
        "manuales de aceptación con usuarios de IECA. La regla de aportación del 33% quedó "
        "verificada en código y en el caso del ingreso #13. La integración continua en GitHub "
        "Actions cumple el plan de calidad establecido.",
    )


def main() -> None:
    if not DOC_PATH.exists():
        raise FileNotFoundError(DOC_PATH)

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = DOC_PATH.with_name(f"{DOC_PATH.stem}.backup-{stamp}.docx")
    shutil.copy2(DOC_PATH, backup)
    print(f"Backup: {backup}")

    doc = Document(str(DOC_PATH))
    update_use_cases_table(doc)
    update_module_bullets(doc)
    remove_existing_metodologia(doc)
    append_point7_sections(doc)

    try:
        doc.save(str(DOC_PATH))
        print(f"Guardado: {DOC_PATH}")
    except PermissionError:
        alt = DOC_PATH.with_name(f"{DOC_PATH.stem}-completo.docx")
        doc.save(str(alt))
        print(f"Archivo abierto. Guardado en: {alt}")

    print(f"Casos de uso: {len(CASOS_USO)} | Tablas totales: {len(doc.tables)}")


if __name__ == "__main__":
    main()
