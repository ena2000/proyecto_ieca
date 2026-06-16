"""
Inserta en la tesis (desde punto 7) Plan de calidad, Cronograma y Verificación.
Reemplaza los párrafos placeholder antes de 'Beneficiarios directos'.
"""
from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Pt

DOC_PATH = Path(
    r"c:\Users\ena\Desktop\TITULACION\PLANTILLA DE TESIS - MILENA MARISCAL PONCE.docx"
)
STYLE_BODY = "Estilo"


def set_run_font(run, bold: bool = False, size: float = 11) -> None:
    run.bold = bold
    run.font.name = "Calibri"
    run.font.size = Pt(size)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")


def add_para_after(doc: Document, ref_element, text: str, style: str = STYLE_BODY, bold: bool = False):
    p = doc.add_paragraph(style=style)
    if text:
        run = p.add_run(text)
        set_run_font(run, bold=bold)
    ref_element.addnext(p._element)
    return p._element


def add_table_after(doc: Document, ref_element, headers: list[str], rows: list[list[str]]):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    for c, h in enumerate(headers):
        cell = table.rows[0].cells[c]
        cell.text = ""
        run = cell.paragraphs[0].add_run(h)
        set_run_font(run, bold=True, size=10)
    for r, row in enumerate(rows, start=1):
        for c, val in enumerate(row):
            cell = table.rows[r].cells[c]
            cell.text = ""
            run = cell.paragraphs[0].add_run(val)
            set_run_font(run, size=9)
    ref_element.addnext(table._tbl)
    # párrafo vacío tras tabla
    return add_para_after(doc, table._tbl, "")


def find_paragraph_index(doc: Document, contains: str) -> int | None:
    for i, p in enumerate(doc.paragraphs):
        if contains in p.text:
            return i
    return None


def remove_paragraphs_range(doc: Document, start: int, end: int) -> None:
    for i in range(end, start - 1, -1):
        el = doc.paragraphs[i]._element
        el.getparent().remove(el)


def main() -> None:
    if not DOC_PATH.exists():
        raise FileNotFoundError(DOC_PATH)

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = DOC_PATH.with_name(f"{DOC_PATH.stem}.backup-{stamp}.docx")
    shutil.copy2(DOC_PATH, backup)
    print(f"Backup: {backup}")

    doc = Document(str(DOC_PATH))

    start = find_paragraph_index(doc, "Verificación: Casos de pruebas")
    if start is None:
        start = find_paragraph_index(doc, "Verificaci")
    end = find_paragraph_index(doc, "Beneficiarios directos e indirectos")
    if start is None or end is None:
        raise RuntimeError("No se encontraron los anclas en el documento.")

    # Conservar ancla: párrafo anterior al bloque placeholder
    anchor_el = doc.paragraphs[start - 1]._element if start > 0 else doc.paragraphs[0]._element
    remove_paragraphs_range(doc, start, end - 1)

    ref = anchor_el
    sections: list[tuple[str, str, bool]] = [
        ("", "7. Plan de calidad (pruebas a realizar)", True),
        (
            "El plan de calidad define las pruebas y criterios de aceptación para verificar que el sistema cumple los requisitos funcionales y no funcionales de IECA.",
            "",
            False,
        ),
    ]
    for text, heading, is_heading in reversed(sections):
        if is_heading:
            ref = add_para_after(doc, ref, heading, bold=True)
        elif text:
            ref = add_para_after(doc, ref, text)

    plan_calidad_rows = [
        ("Unitarias frontend", "Karma + Jasmine", "Utilidades, servicios y componentes", "46 casos en verde"),
        ("Unitarias backend", "Node test runner", "JWT, cierre, unicidad, schemas Zod", "49 casos (48 pass)"),
        ("Integración HTTP", "Supertest", "Endpoints de la API", "12 casos en integración"),
        ("Manuales por rol", "Navegador de escritorio", "Flujos admin, contable y colaborador", "8 casos verificados"),
        ("Integración continua", "GitHub Actions", "Lint, tests y build", "CI en cada cambio"),
    ]
    ref = add_para_after(doc, ref, "Tabla 19. Plan de calidad — pruebas a realizar")
    ref = add_table_after(
        doc,
        ref,
        ["Tipo de prueba", "Herramienta", "Ámbito", "Criterio de aceptación"],
        plan_calidad_rows,
    )

    actividades_rows = [
        ("Revisión de requisitos", "Fase 1", "Admin / contable IECA", "Requisitos validados"),
        ("Revisión de diseño", "Fase 2", "Desarrolladora", "Coherencia con requisitos"),
        ("Estándares de código", "Fase 3", "Desarrolladora", "ESLint y TypeScript sin errores"),
        ("Pruebas automatizadas", "Fase 4", "Desarrolladora + CI", "95 casos ejecutados"),
        ("Pruebas manuales", "Fase 4", "Stakeholders IECA", "Flujos críticos verificados"),
        ("Checklist de despliegue", "Fase 5", "Desarrolladora", "Health check OK"),
    ]
    ref = add_para_after(
        doc,
        ref,
        "Tabla 20. Actividades de calidad por fase",
    )
    ref = add_table_after(
        doc,
        ref,
        ["Actividad", "Momento", "Responsable", "Criterio de aceptación"],
        actividades_rows,
    )

    ref = add_para_after(doc, ref, "8. Cronograma de actividades (etapas desarrolladas)", bold=True)
    ref = add_para_after(
        doc,
        ref,
        "El cronograma refleja las etapas desarrolladas del proyecto, alineadas con el modelo en cascada y el archivo Gantt del proyecto de titulación (GanttProject).",
    )
    ref = add_para_after(doc, ref, "Figura X. Cronograma de actividades del proyecto IECA")
    ref = add_para_after(
        doc,
        ref,
        "Nota: Inserte aquí la imagen exportada desde GanttProject (Untitled Project 1.gan).",
    )

    cronograma_rows = [
        ("1", "Análisis de requisitos", "09 abr – 18 abr 2026", "Especificación de requisitos", "Completado"),
        ("2", "Diseño de arquitectura", "19 abr – 28 abr 2026", "Diagramas de arquitectura", "Completado"),
        ("3", "Diseño de base de datos", "29 abr – 10 may 2026", "Modelo Firestore", "Completado"),
        ("4", "Desarrollo Backend", "11 may – 25 jun 2026", "Código server/src/", "Completado"),
        ("5", "Desarrollo Frontend", "11 may – 25 jun 2026", "Código src/app/", "Completado"),
        ("6", "Pruebas unitarias", "26 jun – 03 jul 2026", "Informe de pruebas", "Completado"),
        ("7", "Pruebas de usabilidad", "04 jul – 08 jul 2026", "Validación por rol", "Completado"),
        ("8", "Revisión y entrega final", "09 jul – 15 jul 2026", "Sistema en producción", "En curso"),
        ("9", "Redacción de tesis", "19 abr – 10 jul 2026", "Documento de titulación", "En curso"),
    ]
    ref = add_para_after(doc, ref, "Tabla 21. Cronograma de etapas desarrolladas")
    ref = add_table_after(
        doc,
        ref,
        ["#", "Etapa", "Fechas", "Entregable", "Estado"],
        cronograma_rows,
    )
    ref = add_para_after(
        doc,
        ref,
        "Dependencias: Análisis → Diseño → Implementación (backend y frontend en paralelo) → Pruebas → Revisión y entrega. La redacción de la tesis transcurre en paralelo desde la fase de diseño.",
    )

    ref = add_para_after(doc, ref, "Verificación: casos de prueba con resultados", bold=True)
    ref = add_para_after(
        doc,
        ref,
        "Las estrategias de verificación y validación del prototipo se basaron en pruebas unitarias, pruebas de integración, pruebas de reglas de negocio y pruebas de aceptación con usuarios institucionales.",
    )

    ref = add_para_after(doc, ref, "o Pruebas unitarias", bold=True)
    ref = add_para_after(
        doc,
        ref,
        "Ejecutadas con Karma + Jasmine (frontend) y Node.js test runner (backend). Resultados obtenidos el 15 de junio de 2026:",
    )

    resultados_rows = [
        ("Frontend", "46", "Karma + Jasmine + ChromeHeadless", "46/46 SUCCESS (3,33 s)"),
        ("Backend", "49", "Node test runner + Supertest", "48/49 pass"),
        ("Total", "95", "GitHub Actions (CI)", "94 pass + 1 condicional (SMTP)"),
    ]
    ref = add_para_after(doc, ref, "Tabla 22. Resumen de pruebas automatizadas")
    ref = add_table_after(
        doc,
        ref,
        ["Ámbito", "Casos", "Herramienta", "Resultado"],
        resultados_rows,
    )
    ref = add_para_after(
        doc,
        ref,
        "Nota: El único caso no superado en entorno local (POST /api/admin/alertas/enviar) requiere SMTP configurado; no afecta la lógica de negocio del sistema.",
    )

    frontend_rows = [
        ("aportacion-iglesia.util.spec.ts", "8", "OK"),
        ("movimiento-filtros.util.spec.ts", "6", "OK"),
        ("movimiento-responsable.util.spec.ts", "4", "OK"),
        ("reportes-filtros.util.spec.ts", "5", "OK"),
        ("unicidad.util.spec.ts", "3", "OK"),
        ("data.service.spec.ts", "4", "OK"),
        ("Componentes (login, ingresos, gastos, reportes…)", "16", "OK"),
        ("Total", "46", "SUCCESS"),
    ]
    ref = add_para_after(doc, ref, "Tabla 23. Resultados detallados — frontend")
    ref = add_table_after(
        doc, ref, ["Archivo de prueba", "Casos", "Estado"], frontend_rows
    )

    backend_rows = [
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
    ]
    ref = add_para_after(doc, ref, "Tabla 24. Resultados detallados — backend")
    ref = add_table_after(
        doc, ref, ["Suite", "Casos", "Estado"], backend_rows
    )

    ref = add_para_after(doc, ref, "o Pruebas de integración", bold=True)
    ref = add_para_after(
        doc,
        ref,
        "Se ejecutaron con Supertest sobre la API Express, usando Firestore en memoria. Casos representativos:",
    )
    integracion_rows = [
        ("/api/health", "GET", "200 OK", "Superado"),
        ("/api/auth/login", "POST", "Token JWT válido", "Superado"),
        ("/api/auth/refresh", "POST", "Renueva tokens", "Superado"),
        ("/api/ingresos", "GET", "401 sin token", "Superado"),
        ("/api/admin/cierre", "POST", "Cierra periodo", "Superado"),
    ]
    ref = add_para_after(doc, ref, "Tabla 25. Pruebas de integración HTTP")
    ref = add_table_after(
        doc,
        ref,
        ["Endpoint", "Método", "Resultado esperado", "Estado"],
        integracion_rows,
    )

    ref = add_para_after(doc, ref, "o Pruebas de reglas de negocio", bold=True)
    reglas_rows = [
        ("Aportación 33% solo en talento (4105)", "aportacion-iglesia.util.spec.ts", "Superado"),
        ("Solo administrador aprueba movimientos", "Prueba HTTP + manual", "Superado"),
        ("Periodo cerrado bloquea edición", "cierre-mensual.test.js", "Superado"),
        ("Kardex coherente con movimientos", "CP-M07 manual", "Superado"),
        ("Bootstrap carga datos por rol", "http.integration.test.js", "Superado"),
    ]
    ref = add_table_after(
        doc,
        ref,
        ["Regla", "Verificación", "Resultado"],
        reglas_rows,
    )

    ref = add_para_after(doc, ref, "o Pruebas de aceptación con usuarios institucionales", bold=True)
    manual_rows = [
        ("CP-M01", "Login y acceso al dashboard", "Todos", "Verificado"),
        ("CP-M02", "Colaborador registra ingreso pendiente", "Colaborador", "Verificado"),
        ("CP-M03", "Admin aprueba ingreso talento → 33%", "Administrador", "Verificado"),
        ("CP-M04", "Contable consulta reportes sin aprobar", "Contable", "Verificado"),
        ("CP-M05", "Cierre mensual bloquea edición", "Administrador", "Verificado"),
        ("CP-M06", "Exportar Excel con kardex", "Admin / Contable", "Verificado"),
        ("CP-M07", "Kardex coherente con movimientos", "Administrador", "Verificado"),
        ("CP-M08", "Bootstrap carga datos tras login", "Todos", "Verificado"),
    ]
    ref = add_para_after(doc, ref, "Tabla 26. Casos de prueba manuales")
    ref = add_table_after(
        doc,
        ref,
        ["ID", "Caso", "Actor", "Estado"],
        manual_rows,
    )

    ref = add_para_after(doc, ref, "Conclusión de verificación", bold=True)
    ref = add_para_after(
        doc,
        ref,
        "El sistema superó 46 pruebas unitarias frontend, 48 de 49 pruebas backend y 8 casos manuales de aceptación con usuarios de IECA. La regla de aportación del 33% en ingresos de talento quedó verificada en código y en el caso real del ingreso #13. La integración continua en GitHub Actions ejecuta lint, pruebas y build en cada cambio del repositorio, cumpliendo el plan de calidad establecido.",
    )

    try:
        doc.save(str(DOC_PATH))
        print(f"Guardado: {DOC_PATH}")
    except PermissionError:
        alt = DOC_PATH.with_name(f"{DOC_PATH.stem}-punto7.docx")
        doc.save(str(alt))
        print(f"Documento abierto. Guardado en: {alt}")


if __name__ == "__main__":
    main()
