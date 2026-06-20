# Scripts de documentación — Word / tesis

Scripts Python (`python-docx`) para actualizar documentos Word en `TITULACION/`.

## Requisito

```bash
pip install python-docx
```

## Scripts principales

| Script | Destino | Contenido |
|--------|---------|-----------|
| `actualizar-capitulo3-secciones-finales-word.py` | `CAPITULO 3 - ENTENDERLO.docx` | Beneficiarios + Entregables + Propuesta |
| `actualizar-capitulo3-completo-word.py` | `CAPITULO 3 - ENTENDERLO.docx` | Tabla 18 CU + §7 calidad + §8 cronograma + verificación |
| `actualizar-tabla-casos-uso-word.py` | `CAPITULO 3 - ENTENDERLO.docx` | Solo tabla de casos de uso |
| `agregar-beneficiarios-word.py` | Plantilla de tesis | Beneficiarios (plantilla MILENA) |
| `agregar-metodologia-punto7-word.py` | Plantilla de tesis | Plan calidad, cronograma, verificación |

## Archivos de contenido (fuente de verdad)

| Archivo | Uso |
|---------|-----|
| `beneficiarios-contenido.py` | Párrafos de beneficiarios → `docs/BENEFICIARIOS.md` |
| `entregables-propuesta-contenido.py` | EDT y propuesta → `docs/ENTREGABLES.md` y `docs/PROPUESTA.md` |

Tras editar un `*-contenido.py`, actualizar el `.md` correspondiente y ejecutar el script Word.

## Ejecución

```bash
python docs/scripts/actualizar-capitulo3-secciones-finales-word.py
```

Cierra el `.docx` en Word antes de ejecutar para guardar en el archivo principal.
