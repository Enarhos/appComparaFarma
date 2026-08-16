# Product — Documentación

`docs/product/` define **qué es** ComparaFarma como producto y **cómo debe comportarse** — visión, principios, definición funcional, experiencias, decisiones de producto. No gobierna backlog ni ejecución (eso vive en `docs/program/`, ver más abajo) y no es un documento de estrategia nueva: es un índice de lo que ya existe en esta carpeta.

Este archivo no reemplaza `docs/README.md` (el mapa canónico de toda la documentación) — es la vista de detalle de un solo dominio.

## Estructura real (verificada 2026-08-15)

### Raíz de `docs/product/`

- [`VISION.md`](VISION.md) — visión y razón de ser del producto
- [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md) — principios que guían las decisiones de producto
- [`PRODUCT_DEFINITION_v1.0.md`](PRODUCT_DEFINITION_v1.0.md) — definición formal versionada del producto
- [`ROADMAP.md`](ROADMAP.md) — plan de evolución funcional del producto (distinto de `docs/program/ROADMAP.md`, que es la vista de programa por workstream — no se duplican, ver "Dónde está el backlog" más abajo)
- [`RISKS.md`](RISKS.md) — riesgos conocidos del producto
- [`SUBSCRIPTION_STRATEGY.md`](SUBSCRIPTION_STRATEGY.md) — estrategia del motor de suscripciones
- [`PRODUCT_REVIEW_V1.md`](PRODUCT_REVIEW_V1.md) — revisión de producto fechada (2026-06-30), snapshot de un momento específico, no un documento vivo
- [`SEARCH_EXPERIENCE.md`](SEARCH_EXPERIENCE.md), [`RESULTS_EXPERIENCE.md`](RESULTS_EXPERIENCE.md), [`USER_JOURNEYS.md`](USER_JOURNEYS.md) — especificaciones oficiales de experiencia: interfaz-agnósticas, describen qué debe comprender y poder hacer una persona, no cómo se ve la pantalla

> **Nota de asimetría heredada (no resuelta en esta limpieza):** [`experiences/MEDICATION_DETAIL_EXPERIENCE.md`](experiences/MEDICATION_DETAIL_EXPERIENCE.md) y [`experiences/PRICE_ALERTS_EXPERIENCE.md`](experiences/PRICE_ALERTS_EXPERIENCE.md) son el mismo tipo de documento que los tres de arriba (especificación oficial, interfaz-agnóstica) pero viven en `experiences/`, no en la raíz. Esta inconsistencia existía antes de la limpieza de gobierno documental y no se corrigió aquí — corregirla implicaría mover archivos, fuera del alcance de esta revisión (solo reescritura de este índice).

### [`definition/`](definition/) — qué es el producto, en detalle

- [`definition/FUNCTIONAL_CAPABILITIES.md`](definition/FUNCTIONAL_CAPABILITIES.md) — vista consolidada de capacidades funcionales actuales (qué existe implementado, por plataforma, con qué limitaciones). **No reemplaza** a `docs/program/` para backlog, a `docs/technology/` para detalle de implementación, ni a `docs/operations/` para estado operacional de los servicios
- [`definition/PERSONAS.md`](definition/PERSONAS.md) — personas de usuario
- [`definition/PRICE_CHANNELS.md`](definition/PRICE_CHANNELS.md) — semántica de los canales de precio (presencial/online/tarjeta/SBPay) por farmacia
- [`definition/PRODUCT_CANVAS.md`](definition/PRODUCT_CANVAS.md) — canvas de producto

### [`experiences/`](experiences/) — comportamiento del producto, materializado y especificado

- [`experiences/RESULTS.md`](experiences/RESULTS.md), [`experiences/MEDICATION_DETAIL.md`](experiences/MEDICATION_DETAIL.md) — versión **materializada**: comportamiento ya implementado, ligado a componentes reales de `mobile/`
- [`experiences/MEDICATION_DETAIL_EXPERIENCE.md`](experiences/MEDICATION_DETAIL_EXPERIENCE.md), [`experiences/PRICE_ALERTS_EXPERIENCE.md`](experiences/PRICE_ALERTS_EXPERIENCE.md) — especificaciones **oficiales**, interfaz-agnósticas (ver nota de asimetría arriba)

### [`decisions/`](decisions/) — cómo y qué se decidió

- [`decisions/DECISION_LOG.md`](decisions/DECISION_LOG.md) — registro cronológico de decisiones y cierres de producto (histórico append-only, sigue vigente y se sigue actualizando)
- [`decisions/PRODUCT_DECISION_FRAMEWORK.md`](decisions/PRODUCT_DECISION_FRAMEWORK.md) — framework de cómo se evalúan y priorizan decisiones de producto

### [`strategy/`](strategy/)

- [`strategy/COMPANY_STRATEGY.md`](strategy/COMPANY_STRATEGY.md) — estrategia de evolución de app a empresa

### `legal/`

Reservada, sin contenido hoy. Destino previsto para `privacy-policy.html`, que permanece intencionalmente en la raíz de `docs/` mientras esa URL siga publicada externamente (ver `docs/README.md`) — no hay una copia acá.

### `assets/`

Mockups de las experiencias materializadas: `medication-detail/`, `results-experience/`.

## Dónde está el backlog y la ejecución

Product define **qué** debe ser el producto y **cómo** debe comportarse. El trabajo pendiente y la ejecución no se gobiernan desde acá:

- `docs/program/` es la fuente vigente para roadmap consolidado, backlog y ejecución entre workstreams.
- `docs/program/backlog/issues/` contiene los issues de ingeniería todavía activos.

## Documentación histórica de Product

`docs/archive/product/` conserva `BACKLOG_PRODUCT`, `EPICS` y `FEATURE_STATUS` como detalle histórico — documentan cómo era el backlog funcional de producto en su momento, pero **no son fuentes vigentes**. Si buscás backlog activo, la fuente es `docs/program/`, no estos archivos archivados.
