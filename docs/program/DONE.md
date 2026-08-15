# DONE — ComparaFarma (Memoria del Programa)

Registro histórico de logros, a través de todos los workstreams. **Nunca se elimina ni se edita una fila ya registrada** — solo se agregan filas nuevas, en orden cronológico.

Para el detalle completo de cada entrega de ingeniería de producto (2026-06-29 a 2026-08-03), la fuente autoritativa y más granular sigue siendo `docs/product/DECISION_LOG.md` — este documento no la reescribe, la resume por tema y agrega lo que ese log no cubre (Enterprise, Brand, Design, Program), para que la memoria sea completa a través de todos los workstreams.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-DNE-001 |
| **Nombre** | DONE.md |
| **Dominio** | Gestión de Programa (`docs/program/`) |
| **Estado** | Activo |
| **Versión** | 1.2 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager |
| **Nivel de Gobierno** | Histórico / inmutable en sus filas ya registradas |
| **Clasificación** | Memoria Histórica de Programa |
| **Fuente Oficial** | Este documento, como memoria consolidada de programa. `docs/product/DECISION_LOG.md` sigue siendo la fuente de detalle de ingeniería de producto |
| **Documentos de los que depende** | `docs/product/DECISION_LOG.md`, `docs/actas/*`, `docs/enterprise/*`, `docs/brand/*`, `docs/design/*` |
| **Pregunta que responde** | ¿Qué se ha logrado, en orden, a través de todo el programa? |

---

## 2. Propósito

Servir como memoria permanente del proyecto a través de todos los workstreams — no solo de ingeniería de producto (que ya tiene su propia memoria detallada en `docs/product/DECISION_LOG.md`), sino también de Enterprise, Brand, Design y del propio Program.

---

## 3. Alcance

**Este documento define:** un registro cronológico, nunca editado retroactivamente, de logros de programa.

**Este documento NO define:** el detalle línea por línea de cada entrega de ingeniería (→ `docs/product/DECISION_LOG.md`, que este documento resume y referencia sin duplicar).

---

## 4. Contenido principal

### 4.1 Ingeniería de Producto (resumen — detalle completo en `docs/product/DECISION_LOG.md`)

| Fecha | Logro (resumen) |
|---|---|
| 2026-06-29 | `packages/domain` creado — fin de la duplicación de `normalization.ts`/`types.ts` entre `api/` y `mobile/` (ADR-0001, RFC-001) |
| 2026-07-19 | Deploy de `api/` reparado (postmortem PM-001); monitoreo reforzado a cada hora sobre 9 farmacias; Sentry agregado |
| 2026-07-20/22 | `web/` construido y lanzado a producción; historial de precios en Supabase; tracking de clicks (`/api/go`); panel `/admin` (dashboard, config, feedback); SEO reforzado |
| 2026-07-22/27 | Estabilización de calidad de `web/` (tests, lint); ficha permanente de medicamento; corrección de bug de precio en EasyFarma; histórico de precios con gráfico e insights en la ficha |
| 2026-07-28 | Formalización de subagentes de trabajo (`comparafarma-software-factory`, `comparafarma-qa`, `comparafarma-devops`); CEO asume rol explícito |
| 2026-07-31 | CF-111 (timeout AraucoMed) cerrado; ratificación de secuencia de Sprints 0–F; Sprint E (receta completa), Sprint A (CFM-ID), corrección de bug de stock en AraucoMed, spike de bioequivalencia cerrado, Sprint C (alertas email) — todos implementados y mergeados |
| 2026-08-02 | Corrección de referencias documentales a "LET"; Sprint D (cuenta ligera) implementado; Epic "Subscription Platform" registrada y Fase 1 (motor + Google Play adapter) implementada y mergeada |
| 2026-08-02/03 | Subscription Platform Fase 2 implementada con Stripe, luego corregida a Flow (Stripe no admite comercios en Chile) — Fase 2 corregida implementada y mergeada; código de Stripe retirado de `main` |
| 2026-08-15 | **Cierre de la fase Domain Consolidation v2–v4**: tres refactors funcionalmente neutros centralizan en `@comparafarma/domain` lógica que estaba duplicada entre Mobile y Web — `computeAllInOneTotals()` (v2, PR `refactor/domain-cart-totals`), `computeSavings()` (v3, PR `refactor/domain-compute-savings`) y `sortByEffectivePrice()` (v4, PR `refactor/domain-sort-effective-price`). Sin cambios de comportamiento observable en ninguno de los tres. No se planifican nuevas rondas de esta consolidación sin una nueva decisión explícita |

*(Detalle línea por línea, con commits, PRs y números de test, en `docs/product/DECISION_LOG.md`, filas 1–36.)*

### 4.2 Arquitectura Empresarial

| Fecha | Logro |
|---|---|
| 2026-08-02 | Primera auditoría de Gobierno Documental del repositorio completo |
| 2026-08-03 | Reescritura completa de la Arquitectura Empresarial: Digital Asset Register (nuevo), Enterprise Data Model (reescrito), Business Services (reescrito como catálogo oficial), Business Capability Map (reescrito) — acordada nueva secuencia oficial: Carta del Fundador → Visión 2030 → Digital Asset Register → Enterprise Data Model → Business Capability Map → Business Services → Product Portfolio → Operating Model → Enterprise Roadmap |

### 4.3 Arquitectura de Marca

| Fecha | Logro |
|---|---|
| 2026-08-05 | `docs/brand/BRAND_AUDIT.md` — primera auditoría de identidad de marca; identifica el vacío de "Arquitectura de marca" |
| 2026-08-05 | `docs/brand/BRAND_FOUNDATIONS.md` v1.0 — consolidación de identidad (quién es ComparaFarma) |
| 2026-08-05 | `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.0 — estándar documental de 10 secciones, extraído de la revisión de gobierno de `BRAND_FOUNDATIONS.md` v1.1 |
| 2026-08-05 | `docs/brand/VISUAL_IDENTITY.md` v1.0 — principios de percepción visual (sin decisiones gráficas) |
| 2026-08-05 | `docs/brand/DESIGN_CONCEPT.md` v1.0 — concepto de diseño "Orientación", territorio, arquetipo, metáforas analizadas (sin decidir forma gráfica) |
| 2026-08-05 | `docs/brand/BRAND_ARCHITECTURE.md` v1.0 — modelo Branded House recomendado, marca principal identificada, portafolio reconstruido; cierra el vacío señalado por `BRAND_AUDIT.md` |

### 4.4 Arquitectura de Diseño (proceso)

| Fecha | Logro |
|---|---|
| 2026-08-05 | Dominio `docs/design/` creado (README, Design Exploration, Design Decision Log, assets) |
| 2026-08-05 | EXP-001 — exploración de 3 familias conceptuales (Brújula, Mapa, Constelación); board `concept-board-v1.png` generado; ninguna dirección seleccionada todavía |
| 2026-08-05 | DD-001 — concepto central "Orientación" aprobado como base de proceso para todo desarrollo visual futuro (no como decisión final de marca) |

### 4.5 Gobierno de Programa

| Fecha | Logro |
|---|---|
| 2026-08-05 | Dominio `docs/program/` creado: `README.md`, `PROGRAM_BOARD.md`, `MASTER_BACKLOG.md`, `CURRENT_SPRINT.md`, `ROADMAP.md`, `MILESTONES.md`, `RISKS.md`, `DECISION_QUEUE.md`, `DONE.md` (este documento) — primer centro de gobierno operativo consolidado del programa completo |
| 2026-08-05 | **Cierre formal de la Fase 1 del programa (Arquitectura y Fundamentos) y apertura de la Fase 2 (Ejecución y Lanzamiento).** Cerrado el Sprint de Gobierno — Inicialización de `docs/program/` (Estado: Completed, registro completo en `CURRENT_SPRINT.md` §4.1); abierto el sprint "Production Release 1.0" con 4 workstreams (Identidad Visual, Google Play, Producto, Plataforma Web). `PROGRAM_BOARD.md`, `MASTER_BACKLOG.md` y `MILESTONES.md` actualizados a v1.1; creado `docs/program/PHASE_TRANSITION.md` como documento de transición entre ambas fases |

---

## 5. Relaciones

Este documento resume, sin duplicar en detalle, `docs/product/DECISION_LOG.md` (§4.1) y agrega lo ya registrado en `docs/actas/20260803.md` (§4.2), `docs/brand/*` (§4.3) y `docs/design/*` (§4.4). Se relaciona con `docs/program/MILESTONES.md` como su contraparte de alto nivel — cada hito de `MILESTONES.md` agrupa una o más filas de este documento.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Detalle de ingeniería de producto | `docs/product/DECISION_LOG.md` | Resumido, no duplicado (§4.1) | Fuente de detalle completo |
| Reescritura de Arquitectura Empresarial | `docs/actas/20260803.md` | ✔ (§4.2) | — |
| Construcción de Arquitectura de Marca | `docs/brand/*` | ✔ (§4.3) | — |
| Construcción de Arquitectura de Diseño | `docs/design/*` | ✔ (§4.4) | — |

---

## 7. Gobierno

Este documento **nunca se edita retroactivamente**. No reemplaza a `docs/product/DECISION_LOG.md` como fuente de detalle de ingeniería.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

`docs/product/DECISION_LOG.md`, `docs/program/MILESTONES.md`, `docs/program/PHASE_TRANSITION.md`, `docs/actas/*`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial de la memoria histórica de programa, consolidando logros de Ingeniería de Producto, Arquitectura Empresarial, Arquitectura de Marca, Arquitectura de Diseño y Gobierno de Programa. | Ver Matriz de Trazabilidad (§6) |
| 1.1 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Se agrega la entrada de cierre formal de Fase 1 y apertura de Fase 2 (§4.5). No se editó ninguna fila previa. | `docs/program/PHASE_TRANSITION.md` |
| 1.2 | 2026-08-15 | Activo | Pendiente (CEO/fundador) | Se agrega la entrada de cierre de la fase Domain Consolidation v2–v4 (§4.1). No se editó ninguna fila previa. | `CLAUDE.md`, `docs/architecture/DOMAIN_MODEL.md` |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación de la memoria histórica de programa | Enterprise Program Manager | `docs/program/DONE.md` v1.0 (este documento) |
| 2026-08-05 | Registro del cierre formal de Fase 1 | Enterprise Program Manager / PMO Director | `docs/program/DONE.md` v1.1 (este documento) |
| 2026-08-15 | Registro del cierre de la fase Domain Consolidation v2–v4 | CTO (rol asumido) | `docs/program/DONE.md` v1.2 (este documento) |

**Pendiente de definición:** ninguna aprobación formal del CEO/fundador registrada todavía.
