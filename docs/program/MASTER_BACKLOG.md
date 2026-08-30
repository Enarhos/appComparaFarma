# MASTER_BACKLOG — ComparaFarma

Backlog empresarial consolidado. No es una lista de tareas — es el inventario de iniciativas reales del programa, organizadas por Workstream y Épica, con prioridad, estado y dependencias. Cada ítem está reconstruido desde evidencia documental existente (Enterprise, Brand, Design, Product, Release, Analysis, Decision Logs, Actas). No se registró ninguna iniciativa sin fuente.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-BLG-001 |
| **Nombre** | MASTER_BACKLOG.md |
| **Dominio** | Gestión de Programa (`docs/program/`) |
| **Estado** | Activo |
| **Versión** | 1.4 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Portfolio Manager / Enterprise Program Manager |
| **Nivel de Gobierno** | De decisión operativa |
| **Clasificación** | Backlog Empresarial de Programa |
| **Fuente Oficial** | Este documento es la fuente oficial del backlog **a nivel de programa** (épica/workstream). No reemplaza `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` como fuente del detalle funcional de cada ítem de producto |
| **Documentos de los que depende** | `docs/enterprise/*`, `docs/brand/*`, `docs/design/*`, `docs/archive/product/EPICS_2026-08-15.md`, `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md`, `ROADMAP.md`, `DECISION_LOG.md`, `docs/archive/releases/PRODUCTION_READINESS_V2.md`, `docs/archive/assessments/PROJECT_INVENTORY.md`, `docs/actas/*` |
| **Documentos que gobierna** | Ninguno; `CURRENT_SPRINT.md` extrae de aquí el trabajo activo |
| **Pregunta que responde** | ¿Cuáles son todas las iniciativas reales del programa, y en qué estado está cada una? |

---

## 2. Propósito

Consolidar, en un solo documento y con nivel de agregación de programa (no de tarea), todas las iniciativas reales de ComparaFarma a través de sus siete workstreams (Enterprise, Brand, Design, Launch, Product/Engineering, Platform, Growth, Commercial), de modo que ninguna iniciativa relevante quede visible solo dentro de su dominio de origen.

---

## 3. Alcance

**Este documento define:** el inventario completo de épicas por workstream, su prioridad relativa, su estado actual y sus dependencias cruzadas.

**Este documento NO define:** el detalle funcional de cada ítem (vive en su documento de origen — ver columna "Fuente" de cada tabla), ni introduce ninguna iniciativa, producto o línea de negocio que no tenga ya evidencia documental.

---

## 4. Contenido principal

**Reclasificado el 2026-08-05 al cierre de Fase 1.** Las mismas iniciativas de la versión 1.0 de este documento (ninguna eliminada) se reorganizan ahora en tres fases de programa: **FASE 1 (Completada)** — construcción de fundamentos, cerrada; **FASE 2 (En ejecución)** — sprint activo "Production Release 1.0"; **FASE 3 (Futuro)** — todo lo que sigue en backlog y no es requerido para el lanzamiento actual. Dentro de cada fase, las iniciativas conservan su workstream de origen para no perder trazabilidad con la versión anterior.

### 4.1 FASE 1 — Completada (Arquitectura y Fundamentos)

#### Enterprise

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Business Capability Map v2.0 | Alta | ✅ Escrito (Draft, En Elaboración) | Digital Asset Register, Enterprise Data Model | `docs/enterprise/BUSINESS_CAPABILITY_MAP.md` |
| Business Services v2.0 (Catálogo Oficial) | Alta | ✅ Escrito (Draft, En Elaboración) | Business Capability Map | `docs/enterprise/BUSINESS_SERVICES.md` |
| Enterprise Data Model v2.0 | Alta | ✅ Escrito (Draft, En Elaboración) | Digital Asset Register | `docs/enterprise/ENTERPRISE_DATA_MODEL.md` |
| Digital Asset Register v1.0 | Alta | ✅ Escrito (Draft, En Elaboración) | Visión 2030 | `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md` |

#### Brand

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Brand Audit | Alta | ✅ Completo | Ninguna | `docs/design/brand/BRAND_AUDIT.md` |
| Brand Foundations | Alta | ✅ Completo (v1.1, Draft) | Brand Audit | `docs/design/brand/BRAND_FOUNDATIONS.md` |
| Visual Identity | Alta | ✅ Completo (v1.0, Draft) | Brand Foundations | `docs/design/brand/VISUAL_IDENTITY.md` |
| Design Concept | Alta | ✅ Completo (v1.0, Draft) | Visual Identity | `docs/design/brand/DESIGN_CONCEPT.md` |
| Brand Architecture | Alta | ✅ Completo (v1.0, Draft) | Brand Foundations, Enterprise (BCM/BS/EDM/DAR) | `docs/design/brand/BRAND_ARCHITECTURE.md` |

#### Design

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Dominio `docs/design/` (README, Exploration Log, Decision Log) | Alta | ✅ Completo | Design Concept (Brand) | `docs/design/README.md`, `DESIGN_EXPLORATION.md`, `DESIGN_DECISION_LOG.md` |
| DD-001 — Concepto central "Orientación" aprobado para proceso | Alta | ✅ Aprobado (de proceso, no ratificación final de marca) | Design Concept | `docs/design/decisions/DESIGN_DECISION_LOG.md` |

#### Launch (Google Play)

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Bloqueante B-2 — `API_SECRET_KEY` | Alta | ✅ Resuelto | Ninguna | `docs/archive/meetings/20260728.md` |
| Bloqueante B-3 — Algolia API key hardcodeada | Alta | ✅ Resuelto | Ninguna | Confirmado en código actual (`api/src/clients/salcobrand.ts`) |
| Bloqueante B-4 — Target SDK | Alta | ✅ Resuelto (targetSdk 36, minSdk 24) | Ninguna | `docs/archive/releases/PRODUCTION_READINESS_V2.md` §6 |

#### Product / Engineering

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Subscription Platform — Fase 1 (Motor + Google Play adapter) | Media (CFPS 3.0) | ✅ Implementado y mergeado | Ninguna | `docs/archive/product/EPICS_2026-08-15.md` |
| Subscription Platform — Fase 2 (Web Billing, Flow) | Media (CFPS 3.2) | ✅ Implementado y mergeado (corregido de Stripe a Flow) | Fase 1 | `docs/archive/product/EPICS_2026-08-15.md`, `docs/engineering/rfc/RFC-005` |
| Sprint E — Comparación de receta completa (web) | Alta (ratificado) | ✅ Implementado y mergeado | Ninguna | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |
| Sprint A — CFM-ID / Registro Canónico | Media (CFPS 3.0) | ✅ Implementado y mergeado (código); ejecución de migración SQL en producción no confirmada en esta revisión | Ninguna | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md`; incertidumbre señalada en `docs/archive/assessments/PROJECT_INVENTORY.md` §3 |
| Sprint C — Alertas de precio por email (web) | Media (CFPS 3.65) | ✅ Implementado y mergeado | Ninguna | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |
| Sprint D — Cuenta ligera + perfil (web) | Baja (CFPS 2.9, reabierto por el CEO) | ✅ Implementado y mergeado | Ninguna | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |
| CF-111 — Timeout AraucoMed | Media (CFPS 3.2) | ✅ Cerrado (no reproducido) | Ninguna | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |

#### Platform (Web / API)

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Sitio web público (SEO, ficha de medicamento, histórico) | Alta | ✅ Operativo en producción | Ninguna | `docs/archive/assessments/PROJECT_INVENTORY.md` §2 |
| API backend (10 funciones serverless) | Alta | ✅ Operativo en producción | Ninguna | `docs/archive/assessments/PROJECT_INVENTORY.md` §2, §7 |
| Panel `/admin` (Backoffice interno) | Media | ✅ Operativo en producción | Ninguna | `docs/archive/assessments/PROJECT_INVENTORY.md` §2 |
| Monitoreo/CI (monitor cada hora, 9 farmacias) | Alta | ✅ Operativo | Ninguna | `CLAUDE.md`, `docs/product/decisions/DECISION_LOG.md` |

#### Growth

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Favoritos, historial, búsquedas recientes (mobile) | Alta | ✅ Operativo | Ninguna | `docs/archive/assessments/PROJECT_INVENTORY.md` §3 |
| Spike de datos de bioequivalencia | Media | ✅ Cerrado — fuente ISP identificada (`datos.gob.cl`), match exacto viable solo en Dr. Simi/Farmex | Ninguna | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |

#### Commercial

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Motor de Suscripciones (backend, agnóstico de proveedor) | Alta | ✅ Operativo | Ninguna | `docs/engineering/adr/ADR-0002` |
| Donaciones (Khipu) | Baja | ⏸️ Pausado en Mobile y Web (etapa inicial + Vercel Hobby con uso comercial) — integración y capacidad de reactivación intactas | Migrar Vercel a plan compatible con uso comercial antes de reactivar Web | `docs/operations/PLATFORM_OPERATIONAL_STATUS.md` |

#### Program Governance

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Dominio `docs/program/` (9 documentos: README, Board, Backlog, Sprint, Roadmap, Milestones, Risks, Decision Queue, Done) | Alta | ✅ Creado | Ninguna | Este mismo dominio |
| Cierre formal de Fase 1 y transición a Fase 2 | Crítica | ✅ Completado (2026-08-05) | Los 9 documentos anteriores | `docs/program/PHASE_TRANSITION.md` |

---

### 4.2 FASE 2 — En ejecución (Sprint "Production Release 1.0")

#### Brand — Workstream A: Identidad Visual

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Logo System | Alta | ⬜ No iniciado | Selección de familia conceptual (workstream Design) | Roadmap declarado en `VISUAL_IDENTITY.md` y `DESIGN_CONCEPT.md` |
| Color System | Alta | ⬜ No iniciado | Logo System (o en paralelo, según se decida) | Ídem |
| Typography System | Media | ⬜ No iniciado | Logo System | Ídem |
| Iconography | Media | ⬜ No iniciado | Logo System, Color System | Ídem |
| Google Play Brand / Google Play Assets | Alta | ⬜ No iniciado | Logo System, Color System | `docs/design/brand/BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md`; workstream B (Launch) |
| Rebranding público ComparaFarma → PreciosFarma — Fase A (formalización + assets maestros) | Alta | 🟡 Fase A completada, en revisión CTO | Identidad visual ya aprobada (DD-001/002/003) | `docs/design/decisions/DESIGN_DECISION_LOG.md` DD-004; `docs/design/brand/BRAND_ARCHITECTURE.md` §4.2.1 |

#### Design — Workstream A: Identidad Visual

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| EXP-001 — Exploración de 3 familias (Brújula / Mapa / Constelación) | Alta | 🟡 Abierta, sin selección | DD-001 | `docs/archive/design/explorations/DESIGN_EXPLORATION.md` |
| Evaluación de las 3 familias contra matriz de criterios (`DESIGN_CONCEPT.md` §4.8) | Alta | ⬜ No iniciado | EXP-001 | `docs/archive/design/explorations/DESIGN_EXPLORATION.md`, "Próximos pasos" |
| Selección final de dirección visual | Crítica | ⬜ Pendiente | Evaluación de EXP-001 | Ver `DECISION_QUEUE.md` DQ-001, DQ-002 |

#### Launch (Google Play) — Workstream B

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Bloqueante B-1 — Data Safety en Play Console | Crítica | 🔴 Pendiente (última evidencia 2026-07-31, sin confirmación posterior) | Ninguna — acción exclusiva del CEO | `docs/archive/releases/PRODUCTION_READINESS_V2.md`, `docs/archive/releases/PRODUCTION_BLOCKERS_PLAN.md`, `docs/archive/meetings/20260731b.md` |
| Corrección de `eas.json` (`submit.production.android.track: "internal"`) | Alta | 🔴 Riesgo abierto, sin resolver | Ninguna | `docs/archive/releases/PRODUCTION_READINESS_V2.md` §3 |
| Salida de `mobile/` de Prueba Cerrada a Producción | Crítica | 🟢 Resuelto (2026-08-08) | — | `CLAUDE.md` (confirmación del CTO en sesión de chat, 2026-08-08 — ver `CLAUDE.md`, sección "Actualización de estado (2026-08-08)"; sin artefacto de Play Console verificado de forma independiente en este repositorio), `docs/product/strategy/COMPANY_STRATEGY.md` |

#### Product / Engineering — Workstream C: Producto

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Revisión final de calidad | Alta | ⬜ No iniciado | Ninguna | `docs/archive/releases/PRODUCTION_READINESS_V2.md` |
| Checklist de Producción | Alta | 🟡 Parcial (3/4 bloqueantes históricos resueltos) | Cierre de Data Safety (B-1) | `docs/archive/releases/PLAY_CONSOLE_CHECKLIST.md` |
| Analytics — estrategia más allá del evento único actual | Media | ⬜ No iniciado | Ninguna | `docs/program/DECISION_QUEUE.md` DQ-005 |
| Verificación de `API_SECRET_KEY` en Vercel de producción (expone endpoint `?debug=1` si falta) | Alta | ⬜ No verificable desde el repositorio | Ninguna | `docs/archive/releases/PRODUCTION_READINESS_V2.md` §3, §5; DQ-012 |
| Confirmación de migración SQL del Registro Canónico (CFM-ID) en producción | Media | ⬜ No verificable desde el repositorio | Ninguna | `docs/archive/assessments/PROJECT_INVENTORY.md` §3; DQ-011 |

#### Platform (Web) — Workstream D: Plataforma Web

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Landing — aclarar si es activo separado del sitio ya operativo | Media | ⬜ Pendiente de definición | Ninguna | `docs/program/DECISION_QUEUE.md` DQ-004 |
| Integración de la identidad visual resultante en el sitio público | Alta | ⬜ No iniciado | Logo/Color System (Workstream A) | — |

---

### 4.3 FASE 3 — Futuro

#### Enterprise

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Architecture Traceability Matrix | Alta | ⬜ No iniciado | Los 4 documentos de Fase 1 | Próximo documento acordado en `docs/archive/meetings/20260803.md` |
| Product Portfolio (Enterprise) | Media | ⬜ No iniciado | Architecture Traceability Matrix | Acordado en `docs/archive/meetings/20260803.md`; distinto de `docs/program/MASTER_BACKLOG.md` (este documento cubre la misma pregunta desde la óptica de programa, no de Enterprise formal) |
| Operating Model | Media | ⬜ No iniciado | Product Portfolio (Enterprise) | Acordado en `docs/archive/meetings/20260803.md` |
| Enterprise Roadmap | Media | ⬜ No iniciado | Operating Model | Acordado en `docs/archive/meetings/20260803.md` |
| Enterprise Glossary | Baja | ⬜ No iniciado | Ninguna estricta | Acordado en `docs/archive/meetings/20260803.md` |
| Ratificación formal del CEO sobre los 4 documentos de Enterprise ya escritos | Alta | ⬜ Pendiente — transversal, no bloqueante del lanzamiento | Ninguna | Todos los documentos de `docs/enterprise/` declaran esta aprobación como pendiente; `DECISION_QUEUE.md` DQ-007 |

#### Brand

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Ratificación formal del CEO sobre Brand Foundations y Brand Architecture | Crítica | ⬜ Pendiente — transversal, no bloqueante del lanzamiento | Ninguna | `docs/design/brand/BRAND_FOUNDATIONS.md` §22-23; `DECISION_QUEUE.md` DQ-007 |
| Brand Guidelines | Media | ⬜ No iniciado | Logo/Color/Typography System (Fase 2) | `docs/design/brand/BRAND_FOUNDATIONS.md` §1 |
| Marketing Guide | Baja | ⬜ No iniciado | Brand Guidelines | `docs/design/brand/BRAND_FOUNDATIONS.md`, `DESIGN_CONCEPT.md` |

#### Design

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Posible EXP-002 (metáfora "Lente" y/o resolución de "Faro") | Media | ⬜ No iniciado | Evaluación de EXP-001 (Fase 2) | `docs/archive/design/explorations/DESIGN_EXPLORATION.md` |

#### Product / Engineering

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Subscription Platform — Fase 3 (Apple Billing) | — (sin CFPS todavía) | ⬜ Backlog futuro | Ninguna (mobile/ ya fuera de Prueba Cerrada desde 2026-08-08) | `docs/archive/product/EPICS_2026-08-15.md` |
| Subscription Platform — Fase 4 (Plataforma Comercial: planes configurables, cupones, empresas, API Premium) | — (sin CFPS todavía) | ⬜ Backlog futuro | Fase 3 (Apple) | `docs/archive/product/EPICS_2026-08-15.md` |
| Verificación end-to-end de compra real (Google Play) | Alta | 🟡 Desbloqueado (2026-08-08) — pendiente de ejecución | Ninguna (mobile/ ya fuera de Prueba Cerrada) | `docs/archive/product/EPICS_2026-08-15.md`, `docs/archive/releases/PRODUCTION_READINESS_V2.md` §8 |
| Sprint B — Bioequivalentes | Media (CFPS 4.15, alto puntaje) | 🔴 Bloqueado — sin fuente de datos regulatoria confiable integrada | Spike de datos (cerrado, ver Growth) | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |
| **SEARCH-MATCHING-QA-01** — Gate 1 de diagnóstico de búsqueda/matching + fixes P0 (S-1 monofármaco/combinación, S-2 falso positivo bioequivalencia Ahumada) | Alta (P0) | ✅ **Cerrado y mergeado** — PR #128, SHA `90b4702` | Ninguna | `packages/domain/src/__tests__/searchQualityQA.characterization.test.ts`, `api/src/__tests__/searchQualityQA.characterization.test.ts` (branch `diag/gate1-search-matching-qa`, ya mergeada) |
| **BIOEQUIVALENCE-DATA-QUALITY-01** — Agrupación comercial y semántica de bioequivalencia | Media (CFPS 3.70) | 🟡 Pasos 1-2 implementados y testeados en branch `fix/bioequivalence-data-quality-01` (local, **sin push ni PR**); pasos 3-8 no iniciados | Revisión CTO + PR para mergear los pasos 1-2; decisión CTO sobre los pasos 3-8 y sobre las señales no consumidas (Salcobrand `(B)`, Cruz Verde detalle, AraucoMed categoría) | `docs/archive/meetings/20260825.md` (Gate 1); `docs/archive/meetings/20260825 - 1013PM.md` (Gate 2) |
| **CF-SEARCH-001** — Identidad de producto y deduplicación segura (falso merge de variantes comerciales) | Media (CFPS 3.95) | 🟢 Implementado y testeado en branch `fix/cf-search-001-product-identity` (ya pusheada a `origin`); **pendiente de PR/review — no mergeado a `origin/main`** | Ninguna para el fix en sí (branch ya rebasada sobre `origin/main` incluyendo SEARCH-MATCHING-QA-01/PR #128); PR + revisión CTO para mergear | `docs/technology/domain/PRODUCT_IDENTITY.md` (en la branch); PR pendiente de apertura |
| Sprint F | Baja (sin puntuar) | ⬜ Backlog futuro | Ninguna | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |
| Backlog v1.5 (16 ítems UX) | Media | 🟡 6 hechos, 4 parciales, 6 pendientes | Ítems pendientes bloqueados por congelamiento de `mobile/` | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |
| Backlog v2.0 (push notifications, tab bar persistente) | Media | ⬜ No re-verificado, no iniciado | Ninguna evidenciada | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |

##### Detalle — SEARCH-MATCHING-QA-01

**Estado: CERRADO/COMPLETADO.** Mergeado a `origin/main` vía **PR #128**, **SHA `90b4702`**.

**Gate 1 — diagnóstico de caracterización** (branch `diag/gate1-search-matching-qa`, commit de caracterización `e8f68c8`): mapeo completo del pipeline de búsqueda (query Mobile → API → 9 adapters → normalización → matching → `matchKey` → `presentationKey` → `mergeDuplicates` → render) y reproducción contra datos reales de producción de 5 hallazgos de QA reportados (fragmentación de identidad comercial, match incorrecto omeprazol/esomeprazol, posibles duplicados de EasyFarma, semántica del contador "N bioequivalentes disponibles", concentración de la consulta ignorada en el ranking). El diagnóstico encontró además **3 hallazgos adicionales no reportados por QA**, dos de ellos P0 (S-1, S-2). Se agregaron 37 tests de caracterización que documentaban los defectos sin corregirlos todavía (metodología `it.fails`), sin tocar código productivo en este Gate.

**S-1 (P0) — Colisión de `matchKey` entre monofármaco y combinación farmacológica.** `matchKey()` capturaba solo el primer principio activo del nombre, por lo que p. ej. "Losartán 50mg" y "Losartán 50mg + Hidroclorotiazida 12.5mg" compartían identidad y se fusionaban bajo una sola tarjeta comparando precio — riesgo clínico, no solo de UX. Corregido agregando un token `combo:` a `presentationKey` (capa de identidad comercial, no persistida), **sin tocar `matchKey`** (clave persistida de `price_history`, `medication_match_key_aliases`, `pharmacy_clicks`, `email_alerts`). La validación contra datos reales de producción encontró, durante el propio proceso de corrección, una **segunda colisión real no reportada originalmente** (Salbutamol vs Salbutamol + Beclometasona), corregida por el mismo fix y cubierta por test.

**S-2 (P0) — Falso positivo sistemático de bioequivalencia en el adapter de Ahumada.** El adapter marcaba el 100% de las ofertas de Ahumada como bioequivalentes por un bug de substring (`"bioequivalent-badge"` matcheaba el contenedor `sellcondition-bioequivalent-badges`, presente vacío en todos los tiles del sitio, no el badge real). Corregido con detección de token de clase exacto. Validado contra el sitio real (12 búsquedas / 206 ofertas, 2026-08-27): de 206/206 ofertas marcadas Bio a **82/206**; el caso Tapsin bajó de 24 a **7** bioequivalentes, coincidiendo exactamente con lo diagnosticado en el Gate 1.

**Gen 4 de slugs (Web):** agregada a la cadena de fallback existente (Gen 3 → Gen 2 → Gen 1) por el cambio de composición de `presentationKey` que introdujo S-1, con redirect automático para URLs viejas de productos combinación.

**Explícitamente fuera de alcance de esta iniciativa (diferido, no implementado aquí):** QA-02 relevancia omeprazol/esomeprazol (confirmado que el match ocurre dentro de los buscadores de cada farmacia, no en `matchKey` propio); QA-05 ranking/relevancia por concentración (`cleanQuery` descarta la concentración de la consulta — diseño recomendado, no implementado); GTIN/EAN como eje de identidad; verificación de la semántica de `has_bioequivalent` en el adapter de Salcobrand (no verificable sin credenciales de Algolia); S-3, bug de `keyExtractor` no único en Mobile (ver FOLLOW_UP de `CF-SEARCH-001` más abajo, que es donde terminó resolviéndose el síntoma relacionado de navegación).

**Relación con `CF-SEARCH-001` — no hay duplicación, son dos problemas distintos y consecutivos:** `SEARCH-MATCHING-QA-01` resolvió la colisión de identidad entre **combinaciones farmacológicas** (mismo principio activo base más un segundo ingrediente) y un bug de datos de bioequivalencia en un adapter puntual. `CF-SEARCH-001` (ver detalle debajo) resolvió, después y de forma independiente, la fusión incorrecta de **variantes comerciales de una misma marca sin combinación farmacológica** (ej. "Tapsin Rojo" vs "Tapsin Forte" — mismo principio base, distinguidos por calificador comercial y forma farmacéutica, no por un segundo ingrediente), además de un bug de navegación en Mobile y de integridad de oferta en `mergeDuplicates` no relacionados con `SEARCH-MATCHING-QA-01`. La branch de `CF-SEARCH-001` se creó sobre `origin/main` ya incluyendo este merge (PR #128 / SHA `90b4702`), y sus tokens `|var:`/`|form:` se diseñaron explícitamente para coexistir con el `|combo:` de esta iniciativa sin conflicto de mecanismo ni de merge.

##### Detalle — BIOEQUIVALENCE-DATA-QUALITY-01

Distinto de "Sprint B — Bioequivalentes" (bloqueado por falta de fuente regulatoria externa confiable): esta iniciativa no depende de datos regulatorios nuevos, corrige cómo PreciosFarma agrupa y presenta el dato de bioequivalencia que las propias farmacias ya entregan hoy.

**Problema (Gate 1, cerrado — `docs/archive/meetings/20260825.md`):** un mismo `matchKey` (ej. `paracetamol|500mg|16`) puede llegar de Dr. Simi con laboratorio `ANDRÓMACO`/`isBioequivalent: true` y de Farmex con `ANDROMACO`/`isBioequivalent: false`, y hoy se muestran como productos separados porque `presentationKey` incluye `bio:true`/`bio:false`/`bio:unknown` como parte de la identidad comercial. Además, Farmex y EasyFarma hardcodean `false` (no es un "no bioequivalente" confirmado, es dato no implementado) y Cruz Verde/Salcobrand/Dr. Simi colapsan "no informado" en `false` en sus adapters. Patrón confirmado también en omeprazol, ibuprofeno, losartán y amoxicilina — no es un caso aislado de Paracetamol.

**Arquitectura recomendada (Gate 2 — "Option D"):**
- `PharmacyPrice` gana `isBioequivalent: boolean | null` (cambio aditivo al contrato de dominio).
- `presentationKey` pierde el componente `bio:` y gana un token de forma farmacéutica (comprimidos/masticables/efervescentes ya no se fusionan incorrectamente).
- El flag de bioequivalencia a nivel de grupo deja de heredarse del `canonical` y se deriva con una función explícita nueva (`deriveGroupBioStatus`), separada del flag por oferta.
- `matchKey` queda intacto/persistido igual — sin impacto en histórico de precios (usa `match_key`, no `presentationKey`).

**Decisiones CTO/Product ya cerradas en Gate 2 (no reabrir sin evidencia nueva):**
- **V-1 (política de derivación del flag de grupo) — ANY:** si al menos una farmacia confirma bioequivalencia y ninguna la contradice, el grupo se muestra como bioequivalente; cada oferta individual sigue mostrando su propio estado real (ej. Farmex seguiría diciendo "no informada" si no confirma).
- **V-2 (forma farmacéutica) — SÍ:** se agrega como token nuevo en la identidad comercial (`presentationKey`), no en `matchKey`. Corrige un false-merge ya existente hoy entre comprimidos/masticables/efervescentes.
- **W-1 (gobernanza/timing):** la iniciativa entra al backlog ahora, pero la ejecución queda gateada. **El Paso 2 (y todos los pasos posteriores) no deben iniciarse hasta que se confirme el cierre de la revisión de Google Play del release Mobile vc33** (`docs/program/CURRENT_SPRINT.md` — estado `WAITING_FOR_GOOGLE_PLAY_REVIEW` a la fecha de esta entrada).

**Secuencia de ejecución diseñada (8 pasos):**
0. Decisiones CTO (cerrado — esta entrada las registra).
1. ✅ Red de seguridad de regresión: tests sobre el comportamiento actual antes de tocar nada.
2. ✅ Adapter fix — el gate W-1 (revisión vc33) cerró con la aprobación de vc33 en Closed Testing.
3. ⬜ Instrumentación read-only para medir la frecuencia real de casos de conflicto entre farmacias.
4. ⬜ Contrato aditivo (`PharmacyPrice.isBioequivalent: boolean | null`).
5. ⬜ Derivación explícita del flag de grupo (`deriveGroupBioStatus`, política ANY).
6. ⬜ UI por oferta en Web y Mobile (mostrar el estado real de cada farmacia, no solo el del grupo).
7. ⬜ Cambio de `presentationKey` (quita `bio:`, agrega forma farmacéutica) + regeneración de slugs en Web (rotación de URLs, riesgo SEO a evaluar antes de ejecutar).
8. ⬜ Verificación en producción.

**Auditoría de re-verificación (2026-08-30) — corrige premisas del Gate 1.** Auditoría end-to-end con evidencia fresca (GET read-only a las 9 fuentes + 10 búsquedas de producción: 914 tarjetas, 1.081 ofertas). Resultados que **cambian** lo que asumía el Gate 1:

- **El alcance eran 9 adaptadores, no 5.** Ahumada, EcoFarmacias, Sermecoop y AraucoMed tenían el mismo defecto (ausencia de señal escrita como `false`), no solo Farmex/EasyFarma/Cruz Verde/Salcobrand/Dr. Simi. Ninguno emitía `null`: 0 de 1.081 ofertas de producción.
- **Cruz Verde no tenía "señales estructuradas que colapsaban".** Los dos campos que leía el código (`bioequivalent_indicator`, `c_bioequivalente`) **no existen** en el endpoint de búsqueda — ni con ese nombre ni con otro. Era un `false` fijo disfrazado (0 de 170 ofertas con `true`). El atributo real (`c_isBioequivalent`) solo está en el endpoint de DETALLE.
- **Salcobrand era un falso positivo grave, no un colapso de ausencia.** `bioequivalent_filter.has_bioequivalent` significa "TIENE bioequivalentes disponibles", no "ES bioequivalente" — el propio campo trae la etiqueta `"Bioequivalentes"` / `"Sin Bioequivalentes"`. PreciosFarma publicaba "🌿 Bioequivalente" sobre los REFERENTES (Lipitor (R), Cozaar (R), Actron (R), Panadol Advance (R), Glafornil XR (R)): 7 de 7 productos "(R)" observados. En sentido inverso, 34 de sus 92 ofertas marcadas `false` llevaban el sello "(B)" del ISP en su propio nombre. Este punto quedó explícitamente fuera de alcance de `SEARCH-MATCHING-QA-01` por falta de credenciales de Algolia; ahora está verificado contra el índice real.
- **Dr. Simi NO debía pasar a `null`.** Es la única fuente con evidencia NEGATIVA explícita (`Bioequivalente: ["NO"]`, campo presente en el 100% de sus productos). Su `false` es real y se conserva; lo que se corrigió es el colapso latente cuando el campo falta o trae un valor fuera del vocabulario.
- **El fix de Ahumada (S-2) se re-verificó contra el sitio real** (paracetamol, 24 tiles): 9 con badge real vs 24 contenedores vacíos, sin falsos positivos y sin falsos negativos observables. AraucoMed tiene la misma trampa con el sticker `bioequivalente-2026.png`, que su theme inyecta en el 100% de los tiles.

**Sobre la política ANY (V-1) y el Caso G.** Simulando hoy el retiro de `bio:` de `presentationKey` sobre datos reales, 71 grupos fusionarían tarjetas y **los 71** exhibirían una "contradicción" `true`/`false` — todas falsas, porque el `false` era ausencia de dato. Con la semántica ya corregida, sobre 843 identidades reales quedan **0 contradicciones** (146 confirmadas, 38 no-confirmadas de Dr. Simi, 659 desconocidas). Conclusión: cualquier derivación de estado de grupo (paso 5) es inservible antes del paso 2, y el conflicto real es estructuralmente posible pero hoy no observable — queda cubierto por fixture sintético, no por datos.

**Impacto medido del paso 2 sobre Web.** El valor del token `|bio:` cambia en el **81,7 %** de las tarjetas, rotando el hash de su slug. Las generaciones existentes no lo cubren (ellas quitan segmentos; acá el segmento sigue con otro valor), así que se agregó **Gen 6-bio** a `web/src/lib/resolveMedication.ts`. Sin ese paso, 4 de cada 5 URLs de ficha indexadas darían 404. El conteo de tarjetas es estable (914 → 921, +0,8 %).

**Nota de gating explícita:** el gate W-1 se cumplió (vc33 aprobada y publicada en Closed Testing) y por eso se ejecutaron los pasos 1-2. Los pasos 3-8 siguen sin autorización: su inicio requiere decisión explícita de Mario/ChatGPT, igual que antes. Los pasos 1-2 están en branch local sin push ni PR.

**Scoring CFPS (`docs/product/decisions/PRODUCT_DECISION_FRAMEWORK.md`):** VU=4 (corrige información de bioequivalencia potencialmente errónea y duplicación visual que confunde al usuario) · VN=4 (impacto directo en confianza, criterio explícito del framework) · DF=3 (precisión de comparación es parte del valor central, pero esto es corrección de calidad de datos, no una función nueva diferenciadora) · IE=4 (alineado con independencia/precisión antes que rentabilidad, sin tocar monetización) · CT=3 (aditivo y sin romper Mobile en producción, pero toca 5 adapters + `presentationKey` + rotación de slugs SEO + UI en dos plataformas) · CM=4 (una vez implementada la derivación explícita, bajo mantenimiento) · RG=4 (riesgo mitigado por diseño: contrato aditivo, cero impacto en price history, tests de regresión antes del Paso 2; el riesgo residual mayor es la rotación SEO del Paso 7). **CFPS = (4×0.25)+(4×0.15)+(3×0.20)+(4×0.20)+(3×0.10)+(4×0.05)+(4×0.05) = 3.70 → Media.** Score de referencia para priorización de Mario/ChatGPT, no una decisión de sprint.

##### Detalle — CF-SEARCH-001

**Estado:** implementado y testeado en la branch `fix/cf-search-001-product-identity` (pusheada a `origin`, no mergeada). Esta entrada no estaba registrada en `MASTER_BACKLOG.md` ni en `CURRENT_SPRINT.md` al momento de cerrarse el fix — mismo patrón de gobernanza ya observado con `BIOEQUIVALENCE-DATA-QUALITY-01` (implementación/decisión primero, registro de backlog después). Diseño completo en `docs/technology/domain/PRODUCT_IDENTITY.md` (vive en la branch, no en `origin/main` todavía).

**Problema — tres defectos independientes, no uno solo** (confundirlos fue lo que mantuvo el problema abierto):

1. **Falso merge de variantes comerciales.** `matchKey()` conserva un solo token de nombre (el primer `brandWord`); todo lo posterior se descarta. `presentationKey` agregaba `bio:` y `brand:`, pero ninguno de los dos discrimina *dentro* de una misma familia de marca. Resultado verificado contra producción real (`GET /api/search?q=tapsin`, 2026-08-27): Tapsin Rojo, Forte, Periodo, Duo, Migraña, Instaflu, Niños y Nocturno — medicamentos con composiciones distintas — se fusionaban en la misma tarjeta con "el más barato". El propio diseño lo describe como "riesgo clínico, no un problema estético".
2. **Navegación por clave no única en Mobile.** Desde el 2026-08-19 `mergeDuplicates` agrupa por `presentationKey`, por lo que varias tarjetas de una misma búsqueda pueden compartir `matchKey`. Mobile seguía navegando y resolviendo la ficha por `matchKey` (`router.push({ params: { matchKey } })` + `results.find(r => r.matchKey === key)`), que devuelve siempre la primera coincidencia de una lista ordenada por precio ascendente. Efecto verificado: tocar la tarjeta de AraucoMed abría la ficha de EcoFarmacias (con su propio `onlineUrl` real — no hay contaminación de URLs entre farmacias, se verificó cada host contra su dominio propio).
3. **Integridad de oferta en `mergeDuplicates`.** La tarjeta canónica (nombre/laboratorio/imagen) y los precios mostrados se elegían con dos criterios independientes sobre el grupo; el título mostrado podía provenir de una oferta que no era ninguna de las que se mostraban con precio. Explica también parte de la deriva de `canonicalName` ya documentada como causa del redirect loop de `web/src/lib/resolveMedication.ts`.

**Diseño de la solución:**
- Dos tokens nuevos, aditivos, en `presentationKey` (nunca en `matchKey`, que queda intacto y persistido igual — sin impacto en `price_history`, `medication_match_key_aliases`, `pharmacy_clicks`, `email_alerts`): `|var:<v>` (`commercialVariantKey`, variante comercial — primer calificador tras la cabecera de marca) y `|form:<f>` (`dosageFormClass`, forma farmacéutica en clases gruesas: sólido oral, líquido oral, tópico, inyectable, inhalado, oftálmico, supositorio, parche).
- `mergeDuplicates` gana validación de compatibilidad antes de fusionar (`canMergeOffers`): recomputa los ejes desde el `productName` de cada oferta y no fusiona si son incompatibles — defensa en profundidad además del agrupamiento por `presentationKey`.
- Gen 5 de slugs en Web con redirect 301 automático (rotación necesaria por el cambio de `presentationKey`), aprobada por Mario como parte del mismo PR — ya implementada en la branch, sin acción de backlog adicional más allá de esta mención.
- API: `sanitizePharmacyUrl` valida la URL de producto contra el dominio raíz de su propia farmacia en la ingesta (defensa adicional, no motivada por un caso real de contaminación cruzada encontrado en esta auditoría).
- Mobile: navegación/resolución de ficha corregida para usar `presentationKey` en vez de `matchKey`.
- Impacto medido sobre datos reales (9 búsquedas de producción, 2026-08-27): tarjetas +5,1 % (752→790); de 127 tarjetas multi-farmacia, 33 se dividen, ~20 correcciones reales y ~13 falsos splits conservadores aceptados (política explícita: un duplicado visual es preferible a mezclar precios de productos distintos). Tests: domain 173→213, api 325→334, web 247→255, mobile 16→21, todos en verde.

**FOLLOW_UP explícito (decisión de Mario, pendiente de implementación — no ejecutar sin decisión de producto):** favoritos, carrito, alertas e historial en `mobile/` siguen indexados por `matchKey`, que tras este fix **ya no es único por tarjeta** (pueden existir 2+ tarjetas con el mismo `matchKey` pero distinto `presentationKey` — ej. dos variantes comerciales de Tapsin). Efecto: marcar una variante como favorita puede mostrar otra al restaurarla. Migrar las claves persistidas de usuarios reales en producción es una decisión de producto (qué clave usar, cómo migrar datos existentes, si vale la pena para el volumen real de colisiones), no solo una tarea técnica — **no se implementa hasta que Mario/ChatGPT decidan el enfoque**.

**Scoring CFPS (`docs/product/decisions/PRODUCT_DECISION_FRAMEWORK.md`):** VU=5 (el propio diseño lo describe como riesgo clínico — mostrar el precio "más barato" de un producto que en realidad es otro medicamento — y una navegación que abría la ficha/CTA de una farmacia distinta a la tocada) · VN=4 (confianza es el activo central del comparador; corrige un defecto que socava la promesa base del producto) · DF=3 (precisión de comparación es parte del valor central, pero es corrección de calidad/integridad, no una función nueva diferenciadora — mismo criterio aplicado en `BIOEQUIVALENCE-DATA-QUALITY-01`) · IE=4 (alineado con independencia/precisión antes que rentabilidad, sin tocar monetización) · CT=3 (cambio no trivial: 28 archivos, ~2.290 líneas, cruza `packages/domain`/`api`/`web`/`mobile`, aunque aditivo y sin tocar `matchKey` persistido) · CM=4 (documentado en detalle en `PRODUCT_IDENTITY.md`, cinco capas separadas y testeables, con riesgos residuales ya catalogados) · RG=4 (mitigado por diseño — aditivo, `matchKey` intacto, tests de regresión, falsos splits aceptados explícitamente como trade-off más seguro que falsos merges; el riesgo residual mayor es el FOLLOW_UP de claves persistidas en Mobile, ya señalado arriba y no implementado). **CFPS = (5×0.25)+(4×0.15)+(3×0.20)+(4×0.20)+(3×0.10)+(4×0.05)+(4×0.05) = 3.95 → Media (límite alto, a 0.05 de "Alta").** Score de referencia para priorización de Mario/ChatGPT, no una decisión de sprint ni un aval de merge.

#### Growth

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Bioequivalentes (funcionalidad completa) | Media (CFPS 4.15) | 🔴 Bloqueado por fuente de datos parcial | Spike (cerrado, resultado parcial) | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |
| IA / escaneo de receta / sustitutos terapéuticos | — (idea) | ⬜ Idea, sin código | Ninguna | `docs/archive/assessments/PROJECT_INVENTORY.md` §3 |
| Push notifications | — (idea, backlog v2.0) | ⬜ Sin código | Ninguna | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md`, `docs/archive/assessments/PROJECT_INVENTORY.md` §3 |

#### Commercial

| Épica | Prioridad | Estado | Dependencias | Fuente |
|---|---|---|---|---|
| Catálogo comercial de planes vendibles | Crítica | 🔴 Vacío — solo plan placeholder "cortesía" (no vendible) | Definición de precios por el CEO | `docs/archive/assessments/PROJECT_INVENTORY.md` §3, §10; `DECISION_QUEUE.md` DQ-003 |
| Conexión de Suscripciones con `mobile/` | Alta | 🟡 Desbloqueado (2026-08-08) — sigue sin código de gating en mobile, ahora por falta de implementación, no por la restricción | Ninguna (mobile/ ya fuera de Prueba Cerrada) | `docs/archive/releases/PRODUCTION_READINESS_V2.md` §8 |
| Convenios institucionales, API Comercial, Observatorio Farmacéutico, Marketplace futuro | — (previsto) | ⬜ Previsto, sin implementación | Product Portfolio (Enterprise), definición de nombre bajo `BRAND_ARCHITECTURE.md` §4.7 | `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md` (DAR-400) |

---

## 5. Relaciones

Este backlog se relaciona con `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` y `docs/archive/product/EPICS_2026-08-15.md` como su fuente de detalle para el workstream Product/Engineering; con `docs/enterprise/*` para el workstream Enterprise; con `docs/brand/*` y `docs/design/*` para Brand y Design; con `docs/archive/releases/PRODUCTION_READINESS_V2.md` para Launch. No sustituye a ninguno de ellos como fuente de detalle. La reclasificación por fase (§4) se relaciona directamente con `docs/program/PHASE_TRANSITION.md`, que explica el criterio general de cierre de Fase 1 sin repetir el detalle de cada ítem.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Backlog funcional de producto | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` | ✔ resumido por épica (§4.1-4.3) | El detalle de cada ítem (v15-01 a v15-16, etc.) permanece solo en la fuente |
| Épicas de producto | `docs/archive/product/EPICS_2026-08-15.md` | ✔ resumido (§4.1, §4.3) | — |
| Cadena de Arquitectura Empresarial pendiente | `docs/archive/meetings/20260803.md` | ✔ resumido (§4.1, §4.3) | — |
| Roadmap documental de Brand/Design | `docs/design/brand/BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md`, `docs/design/README.md` | ✔ resumido (§4.1, §4.2) | — |
| Bloqueantes de Google Play | `docs/archive/releases/PRODUCTION_READINESS_V2.md`, `PRODUCTION_BLOCKERS_PLAN.md` | ✔ resumido (§4.1, §4.2) | — |
| Patrimonio Comercial previsto | `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md` (DAR-400) | ✔ resumido (§4.3) | — |
| Criterio de cierre de Fase 1 / apertura de Fase 2 | `docs/program/PHASE_TRANSITION.md` | ✔ referenciado (§4) | No se duplica el resumen ejecutivo, solo se aplica el criterio a cada ítem |

---

## 7. Gobierno

Este documento no reemplaza a `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` ni a ningún backlog de dominio — consolida su estado a nivel de programa. Cuando exista una discrepancia, prevalece la fuente original de cada workstream. La reclasificación por fase (v1.1) no elimina ninguna iniciativa de la v1.0 — cada ítem se conserva íntegro, solo se reorganiza bajo la fase que corresponde a su estado real.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

`docs/program/PROGRAM_BOARD.md`, `CURRENT_SPRINT.md`, `ROADMAP.md`, `PHASE_TRANSITION.md`, `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md`, `docs/archive/product/EPICS_2026-08-15.md`, `docs/enterprise/*`, `docs/brand/*`, `docs/design/*`, `docs/archive/releases/PRODUCTION_READINESS_V2.md`, `docs/archive/assessments/PROJECT_INVENTORY.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Reconstrucción inicial del backlog de programa completo a partir de la documentación existente, organizado por 8 workstreams. | Ver Matriz de Trazabilidad (§6) |
| 1.1 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Reclasificación completa de todas las iniciativas (ninguna eliminada) en FASE 1 (Completada), FASE 2 (En ejecución — sprint "Production Release 1.0") y FASE 3 (Futuro), al cierre formal de Fase 1 del programa. | `docs/program/PHASE_TRANSITION.md`, `CURRENT_SPRINT.md` |
| 1.2 | 2026-08-25 | Activo | Pendiente (CEO/fundador) | Agregada iniciativa `BIOEQUIVALENCE-DATA-QUALITY-01` (FASE 3, Product/Engineering) al cierre de Gate 2 de diseño técnico: registro de las 3 decisiones CTO/Product (V-1 ANY, V-2 forma farmacéutica, W-1 gateo a cierre de vc33), la arquitectura recomendada (Option D), la secuencia de 8 pasos y su scoring CFPS. Sin implementación de código; ejecución explícitamente gateada. | `docs/archive/meetings/20260825.md` (Gate 1); decisiones de Gate 2 aportadas en la sesión que originó esta entrada |
| 1.3 | 2026-08-27 | Activo | Pendiente (CEO/fundador) | Agregada iniciativa `CF-SEARCH-001` (FASE 3, Product/Engineering) — falso merge de variantes comerciales, navegación por clave no única en Mobile e integridad de oferta en `mergeDuplicates`. Estado: implementado y testeado en branch `fix/cf-search-001-product-identity` (pusheada a `origin`, pendiente de PR/review, no mergeada a `origin/main`). Registrado su scoring CFPS y un FOLLOW_UP explícito (favoritos/carrito/alertas/historial de Mobile indexados por `matchKey`, que dejó de ser único por tarjeta), marcado como pendiente de decisión de producto y no implementado. | `docs/technology/domain/PRODUCT_IDENTITY.md` (en la branch `fix/cf-search-001-product-identity`) |
| 1.4 | 2026-08-27 | Activo | Pendiente (CEO/fundador) | Agregada iniciativa `SEARCH-MATCHING-QA-01` (FASE 3, Product/Engineering) como **cerrada y mergeada** — Gate 1 de caracterización, fix P0 S-1 (colisión monofármaco/combinación) y fix P0 S-2 (falso positivo de bioequivalencia en Ahumada), referenciando PR #128 y SHA de merge `90b4702`. Se dejó explícito que `CF-SEARCH-001` (registrada en v1.3) es trabajo posterior e independiente sobre variantes comerciales, sin duplicar esta iniciativa. Sin cambios de código ni ampliación de alcance en esta revisión documental. | PR #128 (mergeado a `origin/main`, SHA `90b4702`); tests de caracterización en `packages/domain/src/__tests__/searchQualityQA.characterization.test.ts` y `api/src/__tests__/searchQualityQA.characterization.test.ts` |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Reconstrucción del backlog empresarial de programa | Portfolio Manager / Enterprise Program Manager | `docs/program/MASTER_BACKLOG.md` v1.0 (este documento) |
| 2026-08-05 | Reclasificación del backlog por fase de programa (cierre de Fase 1) | Portfolio Manager / Enterprise Program Manager | `docs/program/MASTER_BACKLOG.md` v1.1 (este documento) |
| 2026-08-27 | Registro de `CF-SEARCH-001` (identidad de producto y deduplicación segura) como insumo de backlog, ya implementado en branch propia | CTO / auditor de producto (análisis, no decisión) | `docs/program/MASTER_BACKLOG.md` v1.3 (este documento) |
| 2026-08-27 | Registro de `SEARCH-MATCHING-QA-01` como iniciativa cerrada y mergeada (PR #128, SHA `90b4702`), completando la trazabilidad documental previa a `CF-SEARCH-001` | CTO / auditor de producto (análisis, no decisión) | `docs/program/MASTER_BACKLOG.md` v1.4 (este documento) |

**Pendiente de definición:** ninguna aprobación formal del CEO/fundador registrada todavía.
