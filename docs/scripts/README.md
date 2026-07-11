# Scripts de documentación — Word / tesis

Scripts Python (`python-docx`) para generar o actualizar documentos Word en `TITULACION/` y apoyar la plantilla de tesis.

## Requisito

```bash
pip install python-docx
```

## Generadores (salida en `TITULACION/`)

| Script | Destino típico | Contenido |
|--------|----------------|-----------|
| `generar-referencias-word.py` | `REFERENCIAS-PARA-COPIAR.docx` | Referencias APA |
| `generar-abreviaturas-word.py` | `ABREVIATURAS-SIMBOLOGIA-PARA-COPIAR.docx` | Abreviaturas y simbología |
| `generar-recomendaciones-word.py` | `RECOMENDACIONES-TRABAJOS-FUTUROS-PARA-COPIAR.docx` | Cap. IV recomendaciones / futuros |
| `generar-cap3-cap4-word.py` | `CAP3-CAP4-PARA-COPIAR.docx` | Criterios, resultados, conclusiones |
| `generar-guia-expertos-word.py` | `GUIA-JUICIO-EXPERTOS-IECA.docx` | Guía operativa para expertos |
| `generar-resultados-pruebas-produccion-word.py` | Word de pruebas | Resultados de pruebas |
| `dump-tesis.py` | `docs/scripts/_tesis_dump.txt` | Dump de texto del `.docx` (local; no versionar) |

## Scripts de actualización Cap. III (Word existente)

| Script | Destino | Contenido |
|--------|---------|-----------|
| `actualizar-capitulo3-secciones-finales-word.py` | `CAPITULO 3 - ENTENDERLO.docx` | Beneficiarios + Entregables + Propuesta |
| `actualizar-capitulo3-completo-word.py` | `CAPITULO 3 - ENTENDERLO.docx` | Tabla CU + calidad + cronograma + verificación |
| `actualizar-tabla-casos-uso-word.py` | `CAPITULO 3 - ENTENDERLO.docx` | Solo tabla de casos de uso |
| `agregar-beneficiarios-word.py` | Plantilla de tesis | Beneficiarios |
| `agregar-metodologia-punto7-word.py` | Plantilla de tesis | Plan calidad, cronograma, verificación |
| `generar-backup-demo-colaboradores.py` | Dataset | Backup demo colaboradores |

## Archivos de contenido (fuente)

| Archivo | Uso |
|---------|-----|
| `beneficiarios-contenido.py` | → `docs/BENEFICIARIOS.md` |
| `entregables-propuesta-contenido.py` | → `docs/ENTREGABLES.md` / `PROPUESTA.md` |
| `metodologia-investigacion-contenido.py` | Metodología de investigación |

## Ejecución

```bash
python docs/scripts/generar-guia-expertos-word.py
python docs/scripts/dump-tesis.py
```

Cierra el `.docx` en Word antes de sobrescribir. El dump `_tesis_dump.txt` es temporal y está en `.gitignore`.
