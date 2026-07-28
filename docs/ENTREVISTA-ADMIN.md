# Anexo 1 — Reunión / entrevista con administración IECA (borrador para tesis)

**Fecha:** 22 de marzo de 2026  
**Lugar:** Iglesia del Evangelio Cuadrangular La Alborada (IECA)  
**Participantes:** Administración de IECA; investigadora (presentación del anteproyecto)  
**Registro:** Nota de voz transcrita por la investigadora  

---

## Transcripción (texto base)

Día 22 de marzo. Acabo de salir de la reunión con la administración de la iglesia del Evangelio Cuadrangular La Alborada. Se mostró el anteproyecto de titulación. Se habló de la gestión financiera o control en los **ministerios de la iglesia** — solo ministerios, **no** en diezmos ni ofrendas generales.

Se explicó el proceso de recolección: cuando realizan el talento, cada ministerio tiene su presupuesto y sus ingresos; cada uno hace su control. La administración entrega una **hoja / informe económico por ministerio**, con actividad, ministerio, lugar, fecha, resumen de ingresos y egresos, resultado de la actividad, cuentas por cobrar, valor total entregado a caja, observaciones, elaborado por quien registra y recibido por administración. Luego se entrega el dinero (efectivo o transferencia) y se emite un **recibo**.

Para el sistema se espera un formato **visual similar** al actual, integrar el **logo de la iglesia** y que sea **amigable** para los usuarios finales. Se acordó reunión con la encargada de **contabilidad** y que administración convocará a los **líderes** para aportar ideas al sistema.

**Aclaración posterior del administrador:** quien debe registrar en el sistema puede ser el **colaborador** del ministerio, no necesariamente solo el líder; por eso en el prototipo se usa el rol **Colaborador** en lugar de depender únicamente del líder.

---

## Párrafo para el cuerpo (Procesamiento / Resultados entrevista)

En la reunión del 22 de marzo de 2026 con la administración de IECA se confirmó que el prototipo debe apoyar el **control financiero de los ministerios**, sin abarcar diezmos u ofrendas generales. Actualmente, tras actividades de talento, cada ministerio elabora su control y la administración entrega un **informe económico en formato físico** (actividad, ingresos, egresos, cuentas por cobrar, valor entregado a caja y observaciones). La administración indicó que **no siempre se completa oportunamente esa hoja**, lo que dificulta el seguimiento. En una aclaración posterior, señaló que el registro puede realizarlo el **colaborador** del ministerio — no solo el líder —, criterio que se reflejó en el rol **Colaborador** del sistema. Asimismo, solicitó una interfaz **similar al formato institucional**, con el **logo de la iglesia** y fácil de usar. Se programó reunión con la contable y encuentros con líderes para seguir recogiendo requerimientos.

---

## Tabla. Categorías temáticas — entrevista administración

| Categoría | Hallazgo | Vínculo con el prototipo |
|-----------|----------|---------------------------|
| Alcance | Solo **ministerios**, no diezmos/ofrendas generales | Registro por `ministerioId` |
| Registro manual | Informe económico en **hoja**; a veces incompleto o tardío | Ingresos/gastos digitales con comprobante |
| **Quién registra** | Puede ser el **colaborador**, no solo el líder | Rol **Colaborador** (no “Líder” como único actor) |
| Flujo a caja | Entrega de dinero + **recibo** | Movimientos aprobados y trazabilidad |
| Usabilidad | Formato visual **similar** + **logo** IECA | Interfaz web institucional |
| Validación | Reuniones con contable y líderes | Trabajos futuros / aceptación |

---

## Frases clave para citar (paráfrasis)

- *“El control es por ministerio, no por diezmos y ofrendas generales.”*
- *“Hoy usan una hoja de informe económico que no siempre se llena.”*
- *“En el sistema puede registrar el **colaborador**, no tiene que ser solo el líder.”*

---

## Nota de redacción en toda la tesis

Donde antes decías **“líder llena la hoja”**, en el **análisis** usa:

- **Proceso actual:** “el líder o responsable del ministerio” (formato físico institucional).  
- **Solución propuesta:** “el **colaborador** del ministerio registra en el sistema” (rol del prototipo).

No contradice: el formato en papel puede decir “líder”; el administrador **validó** que en el software entra el **colaborador**.
