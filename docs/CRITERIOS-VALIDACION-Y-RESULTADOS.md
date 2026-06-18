# Criterios de validación y resultados

**Sistema Web de Gestión Financiera — IECA**

---

## Criterios de validación de la propuesta

Para validar la propuesta tecnológica se utilizaron dos estrategias complementarias, según lo recomendado para proyectos de software: **informe de pruebas** (verificación técnica) y **pruebas de aceptación con usuarios institucionales** (administrador, contable y colaborador de IECA).

### Validación técnica — Informe de pruebas

| Criterio | Estrategia | Resultado |
|----------|------------|-----------|
| Cumplimiento de requisitos funcionales | 95 casos automatizados + 8 manuales | 94 pass + 8 verificados |
| Reglas de negocio (aportación 33 %, cierre, roles) | Pruebas unitarias e integración | Superado |
| Seguridad (JWT, bcrypt, roles) | `auth.test.js` + pruebas manuales | Superado |
| Integración frontend–backend | Supertest + bootstrap | Superado |

### Validación con usuarios institucionales

| ID | Criterio evaluado | Actor | Resultado |
|----|-------------------|-------|-----------|
| V-01 | Login y acceso por rol | Administrador, Contable, Colaborador | Cumple |
| V-02 | Registro de ingreso pendiente | Colaborador | Cumple |
| V-03 | Aprobación y aportación 33 % | Administrador | Cumple |
| V-04 | Consulta de reportes sin aprobar | Contable | Cumple |
| V-05 | Cierre mensual bloquea edición | Administrador | Cumple |
| V-06 | Exportación Excel con kardex | Administrador, Contable | Cumple |
| V-07 | Coherencia del kardex | Administrador | Cumple |
| V-08 | Carga de datos tras login (bootstrap) | Todos los roles | Cumple |

Los casos manuales CP-M01 a CP-M08 documentados en [VERIFICACION.md](./VERIFICACION.md) respaldan esta validación.

### Marco académico — Juicio de expertos (referencia)

Para cumplir el criterio institucional de validación por expertos, se puede aplicar: selección de 12–15 expertos, Método Delphi, concordancia de Kendall y Chi-cuadrado (p ≤ 0,05 = significativo). Criterios sugeridos del cuestionario: cumplimiento de requisitos, adecuación de arquitectura, reglas de negocio, usabilidad en escritorio y viabilidad institucional (escala 1–5).

---

## Resultados

Los hallazgos más relevantes del proyecto, sin interpretación (corresponde a conclusiones o discusión).

### Resultado 1 — Sistema implementado y desplegado

Se construyó el Sistema Web de Gestión Financiera IECA con arquitectura en tres capas (Angular/Ionic, Node.js/Express, Firestore), desplegado en **Firebase Hosting** y **Render**.

### Resultado 2 — Pruebas automatizadas (15 jun 2026)

| Ámbito | Casos ejecutados | Casos superados | Porcentaje |
|--------|------------------|-----------------|------------|
| Frontend | 46 | 46 | 100 % |
| Backend | 49 | 48 | 97,96 % |
| **Total** | **95** | **94** | **98,95 %** |

El único caso no superado (`POST /api/admin/alertas/enviar`) requiere SMTP configurado en local; no afecta la lógica de negocio.

### Resultado 3 — Pruebas de aceptación

Los **8 casos manuales** (CP-M01 a CP-M08) con administrador, contable y colaborador resultaron **verificados**.

### Resultado 4 — Caso de implementación (ingreso #13)

| Indicador | Valor |
|-----------|-------|
| Colaborador | Andrés Quinde |
| Ministerio | Alabanza y Adoración |
| Monto bruto | $182,00 |
| Aportación iglesia (33 %) | $60,06 |
| Monto neto ministerio | $121,94 |
| **Saldo disponible final** | **$41,94** |

Detalle en [IMPLEMENTACION.md](./IMPLEMENTACION.md).

### Resultado 5 — Cronograma

De **9 etapas** planificadas, **7 completadas** (análisis, diseño, desarrollo, pruebas). Etapas 8 (revisión/entrega) y 9 (redacción de tesis) en curso.

### Resultado 6 — Entregables generados

Código fuente (`src/`, `server/src/`), diagramas UML, 18 casos de uso, informe de pruebas, documentación en `docs/`, manual de despliegue (`DEPLOY.md`) y sistema operativo en producción.

---

## Conclusión parcial

El sistema cumple los objetivos planteados: digitalizar la gestión financiera de IECA con reglas institucionales (aprobación, aportación 33 %, kardex) y evidencia verificable en pruebas automatizadas, casos manuales y el caso documentado del ingreso #13.
