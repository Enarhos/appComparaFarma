# docs/program/ — Gobierno Operativo del Programa ComparaFarma

Este dominio no documenta la empresa (eso es `docs/book/` y `docs/strategy/`). No documenta el producto en su forma de backlog/roadmap funcional (eso sigue siendo `docs/product/`). No documenta capacidades, servicios ni patrimonio digital (eso es `docs/enterprise/`). No documenta identidad ni diseño de marca (eso es `docs/brand/` y `docs/design/`).

Este dominio gobierna **la ejecución del programa completo**: dónde está el trabajo real hoy, qué se terminó, qué está activo, qué está bloqueado, qué se prioriza y qué decisiones siguen abiertas — a través de todos los workstreams (Enterprise, Brand, Design, Launch, Growth, Platform, Commercial). Es el único dominio que consolida evidencia de *todos* los demás para responder preguntas de ejecución, no de contenido.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-RDM-001 |
| **Nombre** | README.md (dominio `docs/program/`) |
| **Dominio** | Gestión de Programa (`docs/program/`) |
| **Estado** | Activo |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager / PMO Director / Portfolio Manager |
| **Nivel de Gobierno** | Chárter de Dominio — mismo nivel introducido en `docs/design/README.md` §1, extendido aquí a un dominio de ejecución en vez de un dominio de contenido |
| **Clasificación** | Documento de Gobierno Documental |
| **Fuente Oficial** | Este mismo documento |
| **Documentos de los que depende** | Todos los README de dominio existentes: `docs/enterprise/README.md`, `docs/brand/README.md`, `docs/design/README.md`, `docs/product/README.md`, y transitivamente todo lo que estos gobiernan |
| **Documentos que gobierna** | `docs/program/PROGRAM_BOARD.md`, `MASTER_BACKLOG.md`, `CURRENT_SPRINT.md`, `ROADMAP.md`, `MILESTONES.md`, `RISKS.md`, `DECISION_QUEUE.md`, `DONE.md`, `PHASE_TRANSITION.md` |
| **Pregunta que responde** | ¿Qué es `docs/program/`, qué gobierna, y cómo se relaciona con Enterprise, Product y Brand? |

---

## 2. Propósito

`docs/program/` existe porque, hasta este momento, no había un lugar único donde consultar el estado real de ejecución de todo el proyecto a la vez. Cada dominio (Enterprise, Brand, Design, Product) gobierna su propio contenido y su propio avance interno, pero ninguno responde, de forma consolidada y diaria, preguntas como: ¿dónde estamos?, ¿qué se terminó?, ¿qué estamos haciendo?, ¿qué viene después?, ¿qué está bloqueado?, ¿cuáles son las prioridades?, ¿qué riesgos existen?, ¿qué decisiones siguen pendientes?

Este dominio existe para responder exactamente esas preguntas, todos los días, sin necesidad de leer los ocho dominios documentales por separado. **A partir de este momento, toda sesión de trabajo debe comenzar revisando `docs/program/PROGRAM_BOARD.md` y debe terminar actualizando el estado del programa** en los documentos correspondientes de este dominio.

---

## 3. Alcance

**Este documento define:**

- El propósito y los límites del dominio `docs/program/` (esta sección y la siguiente).
- Los principios de funcionamiento del dominio (§4.1).
- Su relación con Enterprise, Product y Brand/Design (§4.2–§4.4).
- El flujo de trabajo recomendado para usar este dominio en cada sesión (§4.5).

**Este documento NO define:**

- Contenido de identidad, estrategia, arquitectura empresarial, marca o diseño — eso sigue viviendo exclusivamente en `docs/book/`, `docs/strategy/`, `docs/enterprise/`, `docs/brand/`, `docs/design/`.
- Backlog funcional de producto en el sentido de features/UX — eso sigue siendo `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md`, `docs/archive/product/EPICS_2026-08-15.md`, `ROADMAP.md`. `docs/program/MASTER_BACKLOG.md` consolida esas iniciativas a nivel de programa (épicas/workstreams/prioridad/dependencias), no las reemplaza como fuente de detalle funcional.
- Decisiones técnicas de arquitectura de software — eso sigue siendo `docs/engineering/adr/` y `docs/engineering/rfc/`.
- Ninguna estrategia nueva, ningún producto nuevo, ninguna iniciativa que no exista ya en la documentación consultada. Este dominio reconstruye el estado real; no lo inventa.

---

## 4. Contenido principal

### 4.1 Principios del dominio

1. **Este dominio no crea trabajo; lo refleja.** Toda iniciativa registrada en `MASTER_BACKLOG.md` debe poder trazarse a una fuente real (un documento de Enterprise, Brand, Design o Product ya existente). No se registra nada sin evidencia.
2. **Una sola fuente de verdad por tipo de información.** El estado detallado de cada workstream sigue viviendo en su dominio de origen; `docs/program/` consolida el estado, no lo duplica en detalle. Cuando exista una discrepancia entre este dominio y su fuente, prevalece la fuente original — mismo principio ya declarado en `docs/enterprise/README.md`.
3. **El programa se actualiza, no se reescribe.** `DONE.md` y `MILESTONES.md` son registros históricos que nunca se editan retroactivamente ni se borran — solo se agregan filas nuevas, mismo criterio que "Control de Cambios" en `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.
4. **Todo lo que está pendiente de decisión se declara como pendiente, no como decidido.** `DECISION_QUEUE.md` registra preguntas abiertas, nunca decisiones ya tomadas — esas van en `DONE.md` o en el documento de origen correspondiente (por ejemplo, `docs/design/DESIGN_DECISION_LOG.md`).
5. **El programa es transversal a los workstreams, no un workstream más.** `docs/program/` no compite con Enterprise, Brand, Design o Product — los observa a todos a la vez.

### 4.2 Relación con Enterprise

`docs/enterprise/` gobierna capacidades, servicios y patrimonio digital — el "qué construye" y "qué posee" la organización, con vigencia de largo plazo. `docs/program/` gobierna la ejecución en el tiempo de ese trabajo y del resto de los workstreams — el "qué se está haciendo ahora" y "qué sigue". `docs/enterprise/` no cambia de una sesión a otra; `docs/program/` sí. Concretamente, el workstream "Enterprise" dentro de `docs/program/MASTER_BACKLOG.md` y `ROADMAP.md` refleja el avance de `docs/enterprise/` (Business Capability Map, Business Services, Enterprise Data Model, Digital Asset Register, y los documentos todavía pendientes en esa cadena: Architecture Traceability Matrix, Product Portfolio, Operating Model, Enterprise Roadmap), sin redefinir su contenido.

### 4.3 Relación con Product

`docs/product/` gobierna el backlog funcional, el roadmap de producto y las decisiones operativas de ingeniería (vía `PRODUCT_DECISION_FRAMEWORK.md`, `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md`, `docs/archive/product/EPICS_2026-08-15.md`, `DECISION_LOG.md`). `docs/program/MASTER_BACKLOG.md` consolida esas mismas iniciativas junto con las de Enterprise, Brand, Design, Launch, Growth, Platform y Commercial, a un nivel de agregación distinto (épica/workstream, no tarea). `docs/program/` no reemplaza el proceso de scoring CFPS ni el ciclo de vida de un ítem de backlog de producto — solo refleja su estado dentro de la vista de programa completa.

### 4.4 Relación con Brand (y Design)

`docs/brand/` y `docs/design/` gobiernan identidad y proceso de diseño, con su propia cadena de gobierno interna (`BRAND_AUDIT → BRAND_FOUNDATIONS → VISUAL_IDENTITY → DESIGN_CONCEPT → BRAND_ARCHITECTURE`, y en paralelo `docs/design/DESIGN_EXPLORATION.md`/`DESIGN_DECISION_LOG.md`). `docs/program/` refleja el avance de esa cadena como un workstream más (Brand, y por separado Design), y registra en `DECISION_QUEUE.md` las decisiones de marca/diseño que esos dominios ya declaran explícitamente como pendientes (por ejemplo, la selección de familia conceptual en `DESIGN_EXPLORATION.md`, o la ratificación formal del CEO sobre `BRAND_FOUNDATIONS.md`). `docs/program/` no decide ninguna de esas preguntas — solo las hace visibles en un único lugar.

### 4.5 Flujo de trabajo recomendado

**Al iniciar una sesión de trabajo:**
1. Abrir `docs/program/PROGRAM_BOARD.md` — vista ejecutiva del estado general.
2. Revisar `docs/program/CURRENT_SPRINT.md` para saber qué está activo.
3. Revisar `docs/program/DECISION_QUEUE.md` y `RISKS.md` si hay bloqueos o decisiones que podrían resolverse en la sesión.

**Durante la sesión:** trabajar dentro del dominio de contenido que corresponda (Enterprise, Brand, Design, Product, Architecture) — `docs/program/` no es donde se hace el trabajo, es donde se refleja.

**Al finalizar una sesión de trabajo:**
1. Actualizar `docs/program/PROGRAM_BOARD.md` si el estado general cambió.
2. Si algo se completó, registrarlo en `docs/program/DONE.md` (y en `MILESTONES.md` si califica como hito).
3. Si surgió un riesgo nuevo, registrarlo en `docs/program/RISKS.md`.
4. Si surgió una decisión pendiente nueva, registrarla en `docs/program/DECISION_QUEUE.md`.
5. Si el sprint activo cambió de alcance, actualizar `docs/program/CURRENT_SPRINT.md`.

---

## 5. Relaciones

Este documento depende de todos los README de dominio existentes (`docs/enterprise/README.md`, `docs/brand/README.md`, `docs/design/README.md`, `docs/product/README.md`) para declarar correctamente los límites de este nuevo dominio frente a ellos. No depende de ningún documento de contenido específico (eso lo hacen los demás documentos de `docs/program/`, cada uno con su propia matriz de trazabilidad).

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Límites del dominio Enterprise | `docs/enterprise/README.md` | Referencia (§4.2) | — |
| Límites del dominio Product | `docs/product/README.md` | Referencia (§4.3) | — |
| Límites del dominio Brand/Design | `docs/brand/README.md`, `docs/design/README.md` | Referencia (§4.4) | — |
| Nivel de gobierno "Chárter de Dominio" | `docs/design/README.md` §1 (primer uso) | Reutilizado, no redefinido | — |

---

## 7. Gobierno

`docs/program/README.md` **no reemplaza** ningún dominio de contenido existente. Gobierna exclusivamente los ocho documentos operativos de `docs/program/` listados en la Metadata. Cuando exista una discrepancia entre el estado reflejado en `docs/program/` y su fuente original en otro dominio, prevalece la fuente original, y `docs/program/` debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo el repositorio.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

- `docs/program/PROGRAM_BOARD.md`
- `docs/program/MASTER_BACKLOG.md`
- `docs/program/CURRENT_SPRINT.md`
- `docs/program/ROADMAP.md`
- `docs/program/MILESTONES.md`
- `docs/program/RISKS.md`
- `docs/program/DECISION_QUEUE.md`
- `docs/program/DONE.md`
- `docs/program/PHASE_TRANSITION.md`
- `docs/enterprise/README.md`
- `docs/brand/README.md`
- `docs/design/README.md`
- `docs/product/README.md`
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación del dominio `docs/program/` como centro de gobierno operativo del programa completo, transversal a Enterprise, Brand, Design y Product. | `docs/enterprise/README.md`, `docs/brand/README.md`, `docs/design/README.md`, `docs/product/README.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-02 | Auditoría de Gobierno Documental general del repositorio | CTO (rol de Arquitecto de Documentación) | `docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` |
| 2026-08-03 | Reescritura completa de la Arquitectura Empresarial | Enterprise Architect | `docs/enterprise/BUSINESS_CAPABILITY_MAP.md`, `BUSINESS_SERVICES.md`, `ENTERPRISE_DATA_MODEL.md` v2.0; `docs/strategy/DIGITAL_ASSET_REGISTER.md` v1.0 |
| 2026-08-05 | Construcción de la Arquitectura de Marca y de Diseño | Brand Strategist / Chief Brand Officer / Brand Architect / Director Creativo | `docs/brand/*`, `docs/design/*` |
| 2026-08-05 | Creación del dominio de gobierno operativo del programa | Enterprise Program Manager / PMO Director / Portfolio Manager | `docs/program/README.md` (este documento) y el resto de `docs/program/` |

**Pendiente de definición:** ninguna de las acciones anteriores cuenta todavía con una aprobación formal registrada del CEO/fundador.
