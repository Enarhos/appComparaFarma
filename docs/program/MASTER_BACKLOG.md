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
| **Versión** | 1.1 |
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
| Sprint F | Baja (sin puntuar) | ⬜ Backlog futuro | Ninguna | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |
| Backlog v1.5 (16 ítems UX) | Media | 🟡 6 hechos, 4 parciales, 6 pendientes | Ítems pendientes bloqueados por congelamiento de `mobile/` | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |
| Backlog v2.0 (push notifications, tab bar persistente) | Media | ⬜ No re-verificado, no iniciado | Ninguna evidenciada | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |

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

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Reconstrucción del backlog empresarial de programa | Portfolio Manager / Enterprise Program Manager | `docs/program/MASTER_BACKLOG.md` v1.0 (este documento) |
| 2026-08-05 | Reclasificación del backlog por fase de programa (cierre de Fase 1) | Portfolio Manager / Enterprise Program Manager | `docs/program/MASTER_BACKLOG.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna aprobación formal del CEO/fundador registrada todavía.
