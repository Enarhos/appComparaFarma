# PHASE_TRANSITION — ComparaFarma (Cierre de Fase 1 → Apertura de Fase 2)

Documento único de transición formal entre la Fase 1 (Arquitectura y Fundamentos) y la Fase 2 (Ejecución y Lanzamiento) del programa ComparaFarma. No repite el detalle ya registrado en otros documentos de `docs/program/` — lo resume y referencia. Junto con `PROGRAM_BOARD.md` y `CURRENT_SPRINT.md`, este documento debe ser suficiente para que cualquier persona que se incorpore al proyecto entienda qué se construyó, en qué estado está el programa, qué falta y cuál es el foco de las próximas semanas, sin necesidad de leer ningún otro archivo.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-PHT-001 |
| **Nombre** | PHASE_TRANSITION.md |
| **Dominio** | Gestión de Programa (`docs/program/`) |
| **Estado** | Activo |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager / PMO Director |
| **Nivel de Gobierno** | De decisión operativa — documento de corte, no se actualiza indefinidamente; su sucesor será el próximo `PHASE_TRANSITION.md` cuando la Fase 2 cierre |
| **Clasificación** | Documento de Transición de Programa |
| **Fuente Oficial** | Este documento es la fuente oficial del cierre de Fase 1 y la apertura de Fase 2 a nivel de programa. No es fuente de ningún contenido de dominio — cada afirmación aquí es resumen o referencia de una fuente ya existente |
| **Documentos de los que depende** | `docs/program/PROGRAM_BOARD.md`, `MASTER_BACKLOG.md`, `MILESTONES.md`, `RISKS.md`, `DECISION_QUEUE.md`, `DONE.md`, `CURRENT_SPRINT.md` |
| **Pregunta que responde** | ¿Qué se logró en la Fase 1, en qué estado queda el programa, y qué define el éxito de la Fase 2? |

---

## 2. Propósito

Marcar, de forma explícita y en un solo lugar, el cierre de la Fase 1 del programa (Arquitectura y Fundamentos) y la apertura formal de la Fase 2 (Ejecución y Lanzamiento) — sin repetir el contenido ya consolidado en `PROGRAM_BOARD.md`, `MASTER_BACKLOG.md`, `MILESTONES.md`, `RISKS.md` y `DECISION_QUEUE.md`, sino sintetizándolo con la perspectiva de un cambio de fase.

---

## 3. Alcance

**Este documento define:** el resumen ejecutivo del cierre de Fase 1, los objetivos y activos que la componen, los riesgos y decisiones que quedan abiertos al momento del cierre, los objetivos declarados de Fase 2, y los criterios con los que se evaluará si el lanzamiento fue exitoso.

**Este documento NO define:** nuevas estrategias, nuevos productos, ni cambios a la visión del programa (fuera de alcance explícito de esta tarea); el detalle línea por línea de cada iniciativa (→ `MASTER_BACKLOG.md`), de cada riesgo (→ `RISKS.md`) o de cada decisión pendiente (→ `DECISION_QUEUE.md`).

---

## 4. Contenido principal

### 4.1 Resumen ejecutivo de la Fase 1

La Fase 1 del programa ComparaFarma — **Arquitectura y Fundamentos** — se declara formalmente cerrada el **2026-08-05**. Comprendió la construcción de cuatro dominios: Arquitectura Empresarial, Gobierno Documental (el estándar `GOVERNED_DOCUMENT_TEMPLATE.md` y su aplicación consistente en todo el repositorio), Arquitectura de Marca, Arquitectura de Diseño (como dominio de proceso) y Gobierno del Programa. Los cuatro se construyeron entre el 2026-08-02 y el 2026-08-05, apoyados en el trabajo de producto ya cerrado previamente (Subscription Platform, Sprints E/A/C/D, `packages/domain`, `web/`, monitoreo).

El cierre de esta fase es un cierre de **construcción**, no de **ratificación**: ninguno de los documentos de Enterprise o Brand tiene, a esta fecha, aprobación formal del CEO/fundador. Esa ratificación no era el objetivo de Fase 1 (que era construir los fundamentos) y queda registrada como trabajo transversal pendiente, sin bloquear la Fase 2.

### 4.2 Objetivos alcanzados

- **Arquitectura Empresarial**: cadena oficial de documentos escrita (Digital Asset Register → Enterprise Data Model → Business Capability Map → Business Services), con secuencia de continuación ya acordada.
- **Arquitectura de Marca**: los 5 documentos que definen quién es ComparaFarma, cómo se percibe, qué territorio de diseño ocupa y cómo se organiza su portafolio (modelo Branded House) — completos.
- **Arquitectura de Diseño**: dominio de proceso instalado (`docs/design/`), con una primera exploración conceptual abierta y un concepto central de proceso aprobado ("Orientación"), listo para que la selección de dirección visual final ocurra en Fase 2.
- **Arquitectura de Portafolio**: resuelta dentro de `BRAND_ARCHITECTURE.md` — marca principal identificada, sin sub-marcas, con criterio de naming diferido para productos futuros.
- **Gobierno del Programa**: dominio `docs/program/` creado y operativo, capaz de responder en una sola lectura (`PROGRAM_BOARD.md`) dónde está el programa completo — lo que hizo posible, en primer lugar, ejecutar este mismo cierre de fase con evidencia consolidada en vez de reconstruirla desde cero.

Detalle completo de cada entrega, con fecha y fuente, en `docs/program/MILESTONES.md` §4.1 y `docs/program/DONE.md` §4.2-4.5.

### 4.3 Activos construidos

| Activo | Dónde vive | Estado |
|---|---|---|
| 4 documentos de Arquitectura Empresarial (DAR, EDM, BCM, BS) | `docs/enterprise/*`, `docs/strategy/DIGITAL_ASSET_REGISTER.md` | Draft, sin ratificar |
| 5 documentos de Arquitectura de Marca | `docs/brand/*` | Draft, sin ratificar |
| Dominio de proceso de Diseño (README, Exploration Log, Decision Log) | `docs/design/*` | Activo, sin dirección visual final |
| Estándar de Gobierno Documental (plantilla de 10 secciones) | `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` | Activo, aplicado en todo `docs/program/`, `docs/brand/`, `docs/enterprise/` |
| Dominio de Gobierno de Programa (9 documentos + este) | `docs/program/*` | Activo |

### 4.4 Riesgos abiertos

El registro completo, con impacto, probabilidad y mitigación, vive en `docs/program/RISKS.md` (17 riesgos). Los relevantes para la transición de fase:

- **R-001 / Bloqueo B-1 — Cerrado (2026-08-08):** el CTO confirmó en chat que la Prueba Cerrada finalizó (confirmación del CTO en sesión de chat, 2026-08-08 — ver `CLAUDE.md`, sección "Actualización de estado (2026-08-08)"; sin artefacto de Play Console verificado de forma independiente en este repositorio). Ya no es un bloqueante vigente.
- **R-014:** ninguna decisión de marca o diseño tiene ratificación formal del CEO — riesgo transversal que acompaña a todo el Workstream A de Fase 2.
- **R-002 / R-003:** configuración de `eas.json` y verificación de `API_SECRET_KEY` en producción — ambos abiertos, relevantes para Workstream B y C respectivamente.
- **R-006:** catálogo comercial de planes vacío — no es parte de los 4 workstreams explícitos de "Production Release 1.0", pero condiciona la "propuesta de valor consolidada" declarada como objetivo del sprint.

### 4.5 Decisiones pendientes

El registro completo vive en `docs/program/DECISION_QUEUE.md` (14 decisiones). Las que condicionan directamente el arranque de Fase 2:

- **DQ-001 / DQ-002:** logo y sistema de colores — primer paso del Workstream A, depende de evaluar las 3 familias conceptuales ya exploradas (`docs/design/DESIGN_EXPLORATION.md`).
- **DQ-008:** confirmación de cierre de Data Safety — acción exclusiva del CEO en Play Console.
- **DQ-003:** catálogo comercial de planes vendibles — decisión de precios, no técnica.
- **DQ-007:** ratificación formal del CEO sobre los documentos de Enterprise y Brand — transversal, no bloqueante, pero pendiente desde antes del cierre de esta fase.
- **DQ-004, DQ-005, DQ-006, DQ-009, DQ-010, DQ-011, DQ-012:** relevantes para Workstreams B, C y D — ver `DECISION_QUEUE.md` para el detalle de cada una.

### 4.6 Objetivos de la Fase 2

**Fase 2: Ejecución y Lanzamiento.** Sprint activo: **"Production Release 1.0"** (detalle completo en `docs/program/CURRENT_SPRINT.md` §4.2). Objetivo declarado: llevar ComparaFarma a Producción en Google Play con una identidad visual profesional y una propuesta de valor consolidada, a través de 4 workstreams:

- **A. Identidad Visual** — Logo System, Color System, Typography System, Iconography.
- **B. Google Play** — Icono, Feature Graphic, Screenshots, Video, Store Listing, ASO básico; resolución de Data Safety.
- **C. Producto** — Revisión final de calidad, Checklist de Producción, Analytics, validaciones finales.
- **D. Plataforma Web** — Landing, sitio público, integración con la identidad visual resultante.

### 4.7 Criterios para considerar exitoso el lanzamiento

- ✅ `mobile/` fuera de Prueba Cerrada (2026-08-08, confirmación del CTO en chat (confirmación del CTO en sesión de chat, 2026-08-08 — ver `CLAUDE.md`, sección "Actualización de estado (2026-08-08)"; sin artefacto de Play Console verificado de forma independiente en este repositorio)).
- Identidad visual (Logo/Color/Typography/Iconography) decidida y aplicada de forma consistente en assets de Google Play, sitio web y (donde aplique) mobile.
- Checklist de Producción (`docs/release/PLAY_CONSOLE_CHECKLIST.md`) en verde, incluyendo las validaciones finales de Workstream C.
- Ficha de Google Play completa: icono, feature graphic, screenshots, store listing y ASO básico publicados.
- Plataforma Web integrada visualmente con la nueva identidad, sin inconsistencia entre canales.
- Ninguno de los criterios anteriores requiere, para cumplirse, la ratificación formal del CEO sobre los documentos de Enterprise/Brand ni la definición del catálogo comercial — ambos siguen su curso en paralelo (Fase 3) y no son criterio de éxito de este lanzamiento específico.

---

## 5. Relaciones

Este documento se apoya en `docs/program/PROGRAM_BOARD.md` (estado consolidado), `MASTER_BACKLOG.md` (detalle de iniciativas por fase), `MILESTONES.md` (hito "Arquitectura Estratégica Consolidada"), `RISKS.md` y `DECISION_QUEUE.md` (detalle de cada riesgo/decisión citados en §4.4-4.5), y `DONE.md` (registro cronológico del cierre). No sustituye a ninguno como fuente de detalle — es el documento que los conecta con la perspectiva de cambio de fase.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Estado consolidado del programa al cierre de Fase 1 | `docs/program/PROGRAM_BOARD.md` v1.1 | ✔ resumido (§4.1-4.3) | — |
| Iniciativas reclasificadas por fase | `docs/program/MASTER_BACKLOG.md` v1.1 | Referenciado (§4.2-4.3), no duplicado | El detalle línea por línea vive solo en la fuente |
| Hito de cierre de Fase 1 | `docs/program/MILESTONES.md` v1.1 | ✔ resumido (§4.1) | — |
| Riesgos abiertos | `docs/program/RISKS.md` | ✔ resumido, subconjunto relevante (§4.4) | Registro completo de 17 riesgos vive solo en la fuente |
| Decisiones pendientes | `docs/program/DECISION_QUEUE.md` | ✔ resumido, subconjunto relevante (§4.5) | Registro completo de 14 decisiones vive solo en la fuente |
| Cierre cronológico del sprint de gobierno | `docs/program/DONE.md` §4.5, `CURRENT_SPRINT.md` §4.1 | Referenciado (§4.1) | — |
| Sprint activo de Fase 2 | `docs/program/CURRENT_SPRINT.md` §4.2 | ✔ resumido (§4.6) | — |

---

## 7. Gobierno

Este documento marca un corte puntual — no se actualiza indefinidamente como `PROGRAM_BOARD.md`. Cuando la Fase 2 cierre, corresponde crear un nuevo documento de transición equivalente (Fase 2 → Fase 3), sin editar retroactivamente este. Cuando exista una discrepancia entre este documento y su fuente original, prevalece la fuente.

Este documento no crea nuevas estrategias, productos ni decisiones de visión — consolida exclusivamente lo ya existente en `docs/program/`, `docs/enterprise/`, `docs/brand/`, `docs/design/` y `docs/release/`, sin modificar ninguno de esos dominios.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

`docs/program/PROGRAM_BOARD.md`, `MASTER_BACKLOG.md`, `CURRENT_SPRINT.md`, `MILESTONES.md`, `RISKS.md`, `DECISION_QUEUE.md`, `DONE.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial — cierre formal de Fase 1 (Arquitectura y Fundamentos) y apertura de Fase 2 (Ejecución y Lanzamiento). | Ver Matriz de Trazabilidad (§6) |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Cierre formal de la Fase 1 del programa y redacción del documento de transición a Fase 2 | Enterprise Program Manager / PMO Director | `docs/program/PHASE_TRANSITION.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna aprobación formal del CEO/fundador registrada todavía.
