# Estado de la Tesis IECA — Avance

> Documento de seguimiento. Última actualización: **10 de julio de 2026**.
> Documento de tesis: `PLANTILLA DE TESIS - MILENA MARISCAL PONCE.docx`

---

## Resumen rápido

- **Escritura del cuerpo: ~93 % terminado.**
- **Falta ~7 %**, centrado en el **juicio de expertos** (Anexo 7 + % de validación), **conclusiones**, **criterios de aceptación/validación** y cierre administrativo (ficha, Anexos 10/12–14).
- **Software en producción:** frontend https://gestion-ieca.web.app · API https://ieca-api.onrender.com

---

## Estado por partes

### Terminado
- [x] Portada, Ficha (resumen/palabras clave), Resumen, Abstract, Introducción
- [x] Capítulo I — Planteamiento del problema
- [x] Capítulo II — Marco teórico, antecedentes, fundamentación
- [x] Capítulo III — Factibilidad, metodología, población/muestra, encuesta (Tablas 15–21),
      requerimientos, casos de uso, propuesta, kardex, tablas de pruebas (30–35)
- [x] Capítulo IV — Recomendaciones y Trabajos futuros
- [x] Resultados de encuesta diagnóstica (texto en tesis)
- [x] Anexos 1, 2, 3 (carta), 4, 5, 6, 8, 9, 15 (manual técnico + capturas), 16
- [x] Referencias (37), Bibliografía (4), Abreviaturas, Simbología
- [x] Prototipo desplegado y verificado (51/51 tests backend; smoke producción OK)

### Pendiente (depende del juicio de expertos)
- [ ] **Juicio de expertos** — quitar `FALTA JUICIO DE EXPERTO` y registrar %
- [ ] **Anexo 7** — nombres, C.I., puntajes 5–100, firma, constancia
- [ ] **Criterios de validación de la propuesta** (cuerpo + %)
- [ ] **Conclusiones** (responder a objetivos con evidencia del juicio)
- [ ] **Criterios de aceptación del producto** (matriz; hoy plantilla)

### Pendiente (cierre administrativo)
- [ ] Ficha: N° de páginas, URL repositorio, docente revisor
- [ ] **Anexo 10** — Acta de entrega (fechas y firma)
- [ ] **Anexos 12, 13, 14** — Certificados (tutor, similitud, revisor)
- [ ] **Anexo 11** — Evidencias fotográficas (opcional)
- [ ] Actualizar índices (F9) al final

### Typos menores (opcional)
- `facilite en la mejora` → `facilite la mejora`
- `Sra Milena` → `Sra. Milena`

---

## Documentos de apoyo en el repo (`docs/`)

| Archivo | Uso |
|---------|-----|
| [ANEXOS-EN-ORDEN.md](./ANEXOS-EN-ORDEN.md) | Checklist de anexos en el Word |
| [GUIA-ANEXOS-TESIS.md](./GUIA-ANEXOS-TESIS.md) | Guía de anexos |
| [ANEXO-1-ENTREVISTA-ADMIN.md](./ANEXO-1-ENTREVISTA-ADMIN.md) | Entrevista administración |
| [ANEXO-5-CRITERIOS-ETICOS.md](./ANEXO-5-CRITERIOS-ETICOS.md) | Criterios éticos |
| [ANEXO-6-INSTRUMENTOS-RECOLECCION.md](./ANEXO-6-INSTRUMENTOS-RECOLECCION.md) | Instrumentos |
| [ANEXO-7-VALIDACION-PROTOTIPO.md](./ANEXO-7-VALIDACION-PROTOTIPO.md) | Validación / expertos |
| [ANEXO-18-DICCIONARIO-FIRESTORE.md](./ANEXO-18-DICCIONARIO-FIRESTORE.md) | Diccionario Firestore |
| [RESULTADOS-ENCUESTA-DIAGNOSTICA.md](./RESULTADOS-ENCUESTA-DIAGNOSTICA.md) | Resultados encuesta |
| [REFERENCIAS-NODE-EXPRESS-APA.md](./REFERENCIAS-NODE-EXPRESS-APA.md) | Referencias APA Node/Express |
| [diagramas/cronograma-tabla-anexo1.md](./diagramas/cronograma-tabla-anexo1.md) | Tabla cronograma Anexo 1 |

Scripts Word: `docs/scripts/generar-*-word.py`, `dump-tesis.py`.  
Guía expertos (Word generado fuera del repo): `TITULACION/GUIA-JUICIO-EXPERTOS-IECA.docx`.

---

## Próximo paso sugerido

1. Completar **juicio de expertos** (3–5) con la guía y el Anexo 7.
2. Pegar % de validación, conclusiones y criterios.
3. Cerrar ficha + Anexos 10/12–14 y F9.
