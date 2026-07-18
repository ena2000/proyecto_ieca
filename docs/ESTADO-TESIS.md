# Estado de la Tesis IECA — Avance

> Documento de seguimiento. Última actualización: **17 de julio de 2026**.
> Documento de tesis: `PLANTILLA DE TESIS - MILENA MARISCAL PONCE.docx`

---

## Aviso — Word en revisión

La plantilla Word **ya fue enviada a revisión**. **No modificar el Word** desde el repositorio ni aplicar scripts de actualización hasta que el revisor la devuelva.

Este archivo y el resto de `docs/` mantienen la **verdad del repositorio** (código, pruebas, diagramas). Pueden diferir en redacción o anexos respecto al Word enviado; eso es intencional mientras dure la revisión.

---

## Resumen rápido

- **Escritura del cuerpo (Word enviado):** ~93 % en el momento del envío.
- **Repositorio:** requisitos, 18 CU, verificación **188/188**, diagramas y despliegue alineados.
- **Validación en repo:** técnica + aceptación (V-01…V-08) — ver [ANEXO-7-VALIDACION-PROTOTIPO.md](./ANEXO-7-VALIDACION-PROTOTIPO.md). No se documenta Delphi en `docs/`.
- **Software en producción:** frontend https://gestion-ieca.web.app · API https://ieca-api.onrender.com (Render **Starter**)

---

## Estado por partes

### Terminado (repo + contenido enviado)

- [x] Portada, Ficha (resumen/palabras clave), Resumen, Abstract, Introducción
- [x] Capítulo I — Planteamiento del problema
- [x] Capítulo II — Marco teórico, antecedentes, fundamentación
- [x] Capítulo III — Factibilidad, metodología, población/muestra, encuesta,
      requerimientos, casos de uso, propuesta, kardex, tablas de pruebas
- [x] Capítulo IV — Recomendaciones y Trabajos futuros (según Word enviado)
- [x] Resultados de encuesta diagnóstica
- [x] Anexos de contenido académico / técnicos según Word enviado
- [x] Referencias, Bibliografía, Abreviaturas, Simbología
- [x] Prototipo desplegado y verificado (**118** FE + **70** BE = **188/188**; smoke producción OK)

### Congelado hasta devolución del revisor (solo Word)

No tocar desde el repo:

- [ ] Observaciones del revisor (cuando regresen)
- [ ] Ficha: N° de páginas, URL repositorio, docente revisor (si el revisor lo pide)
- [ ] Anexos administrativos / certificados (tutor, similitud, revisor) según facultad
- [ ] Actualizar índices (F9) **solo después** de cambios aprobados en Word

### Typos menores (opcional, solo si el revisor pide correcciones)

- `facilite en la mejora` → `facilite la mejora`
- `Sra Milena` → `Sra. Milena`

---

## Documentos de apoyo en el repo (`docs/`)

| Archivo | Uso |
|---------|-----|
| [ANEXOS-EN-ORDEN.md](./ANEXOS-EN-ORDEN.md) | Checklist de anexos (referencia; Word congelado) |
| [GUIA-ANEXOS-TESIS.md](./GUIA-ANEXOS-TESIS.md) | Guía de anexos (referencia; Word congelado) |
| [ANEXO-1-ENTREVISTA-ADMIN.md](./ANEXO-1-ENTREVISTA-ADMIN.md) | Entrevista administración |
| [ANEXO-5-CRITERIOS-ETICOS.md](./ANEXO-5-CRITERIOS-ETICOS.md) | Criterios éticos |
| [ANEXO-6-INSTRUMENTOS-RECOLECCION.md](./ANEXO-6-INSTRUMENTOS-RECOLECCION.md) | Instrumentos |
| [ANEXO-7-VALIDACION-PROTOTIPO.md](./ANEXO-7-VALIDACION-PROTOTIPO.md) | Validación técnica del prototipo |
| [ANEXO-18-DICCIONARIO-FIRESTORE.md](./ANEXO-18-DICCIONARIO-FIRESTORE.md) | Diccionario Firestore |
| [RESULTADOS-ENCUESTA-DIAGNOSTICA.md](./RESULTADOS-ENCUESTA-DIAGNOSTICA.md) | Resultados encuesta |
| [REFERENCIAS-NODE-EXPRESS-APA.md](./REFERENCIAS-NODE-EXPRESS-APA.md) | Referencias APA Node/Express |
| [diagramas/cronograma-tabla-anexo1.md](./diagramas/cronograma-tabla-anexo1.md) | Tabla cronograma Anexo 1 |
| [VERIFICACION.md](./VERIFICACION.md) | Informe de pruebas 185 + 8 manuales |

Scripts Word en `docs/scripts/`: **no ejecutar contra la plantilla enviada** mientras esté en revisión.

---

## Próximo paso sugerido

1. Esperar devolución del revisor sobre el Word.
2. Aplicar **solo** las correcciones que indique (si las hay).
3. Cerrar anexos administrativos / certificados según la facultad.
4. Mantener el repo (código + `docs/`) como respaldo técnico actualizado.
