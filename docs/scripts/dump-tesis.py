# -*- coding: utf-8 -*-
"""Extrae todo el texto (parrafos + tablas) del .docx de la tesis a un .txt."""
from docx import Document

SRC = r"C:\Users\ena\Desktop\TITULACION\PLANTILLA DE TESIS - MILENA MARISCAL PONCE.docx"
OUT = r"C:\Users\ena\Desktop\proyecto_ieca\docs\scripts\_tesis_dump.txt"


def iter_block_items(parent):
    from docx.document import Document as _Doc
    from docx.oxml.table import CT_Tbl
    from docx.oxml.text.paragraph import CT_P
    from docx.table import Table
    from docx.text.paragraph import Paragraph
    body = parent.element.body
    for child in body.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)


doc = Document(SRC)
lines = []
n = 0
for block in iter_block_items(doc):
    from docx.table import Table
    if isinstance(block, Table):
        for row in block.rows:
            cells = [c.text.strip().replace("\n", " ") for c in row.cells]
            lines.append("[TABLA] " + " | ".join(cells))
    else:
        t = block.text.strip()
        n += 1
        if t:
            lines.append(f"{n}| {t}")

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("[OK]", OUT, "parrafos:", n)
