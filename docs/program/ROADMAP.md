# ROADMAP — ComparaFarma (Programa)

Roadmap de programa: la evolución de los 7 workstreams entre sí, no el roadmap funcional de producto (eso es `docs/product/ROADMAP.md`, que este documento referencia sin duplicar).

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-RDP-001 |
| **Nombre** | ROADMAP.md |
| **Dominio** | Gestión de Programa (`docs/program/`) |
| **Estado** | Activo |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager / Portfolio Manager |
| **Nivel de Gobierno** | De decisión operativa |
| **Clasificación** | Roadmap de Programa |
| **Fuente Oficial** | Este documento, para la vista consolidada entre workstreams. No reemplaza `docs/product/ROADMAP.md` (roadmap funcional) ni la futura `docs/enterprise/ENTERPRISE_ROADMAP.md` (roadmap de capacidades empresariales, todavía no escrita) |
| **Documentos de los que depende** | `docs/product/ROADMAP.md`, `docs/enterprise/*`, `docs/brand/*`, `docs/design/*`, `docs/release/PRODUCTION_READINESS_V2.md`, `docs/actas/20260803.md` |
| **Pregunta que responde** | ¿Cómo evoluciona el programa completo, workstream por workstream, y en qué estado está cada uno hoy? |

---

## 2. Propósito

Representar la evolución del programa a través de sus 7 workstreams (Enterprise, Brand, Design, Launch, Growth, Platform, Commercial), mostrando qué tan avanzado está cada uno y qué es lo siguiente en cada uno — sin fechas comprometidas que no existan en la documentación fuente.

---

## 3. Alcance

**Este documento define:** el estado y el siguiente paso de cada workstream, y cómo se relacionan entre sí en el tiempo.

**Este documento NO define:** fechas de entrega comprometidas que no estén ya declaradas en algún documento fuente (no se inventa ninguna), ni el roadmap funcional detallado de producto (→ `docs/product/ROADMAP.md`).

---

## 4. Contenido principal

### 4.1 Vista consolidada por workstream

```
ENTERPRISE   [████████████████░░░░░░░░]  4 documentos escritos (Draft) — falta: Traceability Matrix,
             Product Portfolio, Operating Model, Enterprise Roadmap, Glossary, ratificación CEO

BRAND        [████████████████████░░░░]  5 documentos escritos (Draft, completos) — falta: ratificación
             CEO, luego Logo/Color/Typography System, Guidelines, Google Play Brand, Marketing Guide

DESIGN       [██████░░░░░░░░░░░░░░░░░░]  1 exploración abierta (3 familias), 1 decisión de proceso —
             falta: evaluación contra matriz de criterios, selección de dirección, sistema visual

LAUNCH       [████████████░░░░░░░░░░░░]  3/4 bloqueantes históricos resueltos — falta: Data Safety
             (bloqueante crítico, última evidencia 2026-07-31), corrección de eas.json

PRODUCT/ENG  [████████████████░░░░░░░░]  Subscription Platform Fase 1-2 hechas; Sprints E/A/C/D hechos —
             falta: Fase 3 (Apple), Fase 4 (Comercial), Sprint B (bloqueado), Sprint F (backlog)

PLATFORM     [████████████████████████]  Web y API operativos en producción — sin pendientes críticos
             conocidos

GROWTH       [████████░░░░░░░░░░░░░░░░]  Favoritos/historial operativos — bioequivalentes bloqueado,
             IA e push notifications sin código todavía

COMMERCIAL   [████████░░░░░░░░░░░░░░░░]  Motor de Suscripciones operativo — falta: catálogo comercial
             real, conexión con mobile, definición de precios
```

(Barras estimadas cualitativamente a partir del número de entregables completados vs. declarados en la documentación fuente de cada workstream — no son un porcentaje medido con una métrica formal, que no existe todavía.)

### 4.2 Secuencia y dependencias entre workstreams

```
Enterprise ──┐
             ├──► Brand ──► Design ──► (Logo/Color/Typography System) ──► Google Play Brand ──┐
             │                                                                                  │
             └──► Product Portfolio (Enterprise) ──► Operating Model ──► Enterprise Roadmap    │
                                                                                                  ▼
Product/Engineering ──► Launch (bloqueado por Data Safety) ──────────────────────────► Producción
        │
        └──► Commercial (bloqueado por catálogo de planes + conexión con mobile)

Platform: ya operativo, no bloquea a los demás workstreams.
Growth: depende de Product/Engineering para nuevas capacidades (bioequivalentes, IA).
```

### 4.3 Próximo hito por workstream (sin fecha comprometida salvo que la fuente la declare)

| Workstream | Próximo hito | Fuente |
|---|---|---|
| Enterprise | Architecture Traceability Matrix | `docs/actas/20260803.md` |
| Brand | Ratificación formal del CEO sobre `BRAND_FOUNDATIONS.md`/`BRAND_ARCHITECTURE.md` | `docs/brand/BRAND_FOUNDATIONS.md` §22-23 |
| Design | Evaluación de las 3 familias conceptuales contra la matriz de criterios | `docs/design/DESIGN_EXPLORATION.md` |
| Launch | Confirmación de cierre de Data Safety | `docs/release/PRODUCTION_READINESS_V2.md` |
| Product/Engineering | Sin sprint de ingeniería activo declarado; próximo candidato depende de prioridad del CEO | `docs/program/CURRENT_SPRINT.md` |
| Platform | Sin pendiente crítico declarado | `docs/analysis/PROJECT_INVENTORY.md` |
| Growth | Evaluar si se acota "Sprint B-lite" a Dr. Simi + Farmex (match exacto ISP) | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |
| Commercial | Definición del primer plan comercial real vendible | `docs/product/DECISION_LOG.md` (pendiente recurrente desde Fase 1 de Subscription Platform) |

---

## 5. Relaciones

Este roadmap se apoya en `docs/product/ROADMAP.md` (roadmap funcional de producto, con sus 5 Objetivos Estratégicos) sin duplicarlo, y en la cadena de Arquitectura Empresarial declarada en `docs/enterprise/README.md` y en `docs/actas/20260803.md`. Se relaciona con `docs/program/MILESTONES.md` como el registro de lo ya alcanzado en cada workstream.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Roadmap funcional de producto (5 Objetivos Estratégicos) | `docs/product/ROADMAP.md` | Referencia (§4.3) | No se duplica el detalle de indicadores/capacidades de cada objetivo |
| Cadena pendiente de Arquitectura Empresarial | `docs/actas/20260803.md` | ✔ (§4.1, §4.3) | — |
| Roadmap documental de Brand/Design | `docs/brand/BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md` | ✔ (§4.1, §4.3) | — |

---

## 7. Gobierno

No reemplaza `docs/product/ROADMAP.md` ni la futura `docs/enterprise/ENTERPRISE_ROADMAP.md`. Cuando alguno de esos documentos declare una fecha o secuencia distinta, prevalece la fuente original.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

`docs/program/PROGRAM_BOARD.md`, `MASTER_BACKLOG.md`, `MILESTONES.md`, `docs/product/ROADMAP.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial del roadmap de programa consolidado por workstream. | Ver Matriz de Trazabilidad (§6) |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación del roadmap consolidado de programa | Enterprise Program Manager / Portfolio Manager | `docs/program/ROADMAP.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna aprobación formal del CEO/fundador registrada todavía.
