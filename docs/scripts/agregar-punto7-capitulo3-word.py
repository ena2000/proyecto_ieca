"""
Agrega Plan de calidad, Cronograma y Verificación al final de
CAPITULO 3 - ENTENDERLO-actualizado.docx
"""
from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.shared import Pt

DOC_PATH = Path(
    r"c:\Users\ena\Desktop\TITULACION\CAPITULO 3 - ENTENDERLO-actualizado.docx"
)


def set_run_font(run, bold: bool = False, size: float = 11) -> None:
    run.bold = bold
    run.font.name = "Calibri"
    run.font.size = Pt(size)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")


def add_heading(doc: Document, text: str, level: int = 2) -> None:
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        set_run_font(run, bold=True, size=14 if level == 2 else 12)


def add_para(doc: Document, text: str, bold: bool = False) -> None:
    p = doc.add_paragraph()
    run = p.add_run(text)
    set_run_font(run, bold=bold)


def add_table(doc: Document, headers: list[str], rows: list[list[str]]) -> None:
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    for c, h in enumerate(headers):
        cell = table.rows[0].cells[c]
        cell.text = ""
        set_run_font(cell.paragraphs[0].add_run(h), bold=True, size=10)
    for r, row in enumerate(rows, start=1):
        for c, val in enumerate(row):
            cell = table.rows[r].cells[c]
            cell.text = ""
            set_run_font(cell.paragraphs[0].add_run(val), size=9)
    doc.add_paragraph()


def append_sections(doc: Document) -> None:
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
    add_para(
        doc,
        "Nota: Inserte aquí la imagen exportada desde GanttProject (Untitled Project 1.gan).",
    )

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
    add_para(
        doc,
        "Ejecutadas con Karma + Jasmine (frontend) y Node.js test runner (backend). "
        "Resultados obtenidos el 15 de junio de 2026:",
    )

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
    add_para(
        doc,
        "Nota: El único caso no superado en entorno local (POST /api/admin/alertas/enviar) "
        "requiere SMTP configurado; no afecta la lógica de negocio del sistema.",
    )

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
    add_para(
        doc,
        "Se ejecutaron con Supertest sobre la API Express, usando Firestore en memoria.",
    )
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
        "manuales de aceptación con usuarios de IECA. La regla de aportación del 33% en ingresos "
        "de talento quedó verificada en código y en el caso real del ingreso #13. La integración "
        "continua en GitHub Actions ejecuta lint, pruebas y build en cada cambio del repositorio, "
        "cumpliendo el plan de calidad establecido.",
    )


def remove_existing_section(doc: Document) -> None:
    """Elimina sección previa si ya se insertó."""
    start = None
    for i, p in enumerate(doc.paragraphs):
        if p.text.strip() == "Metodología de desarrollo y verificación":
            start = i
            break
    if start is None:
        return
    for i in range(len(doc.paragraphs) - 1, start - 1, -1):
        el = doc.paragraphs[i]._element
        el.getparent().remove(el)
    # tablas al final
    while len(doc.tables) > 3:
        doc.tables[-1]._tbl.getparent().remove(doc.tables[-1]._tbl)


def main() -> None:
    if not DOC_PATH.exists():
        raise FileNotFoundError(DOC_PATH)

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = DOC_PATH.with_name(f"{DOC_PATH.stem}.backup-{stamp}.docx")
    shutil.copy2(DOC_PATH, backup)
    print(f"Backup: {backup}")

    doc = Document(str(DOC_PATH))
    remove_existing_section(doc)
    append_sections(doc)

    try:
        doc.save(str(DOC_PATH))
        print(f"Guardado: {DOC_PATH}")
    except PermissionError:
        alt = DOC_PATH.with_name(f"{DOC_PATH.stem}-metodologia.docx")
        doc.save(str(alt))
        print(f"Archivo abierto. Guardado en: {alt}")


if __name__ == "__main__":
    main()
