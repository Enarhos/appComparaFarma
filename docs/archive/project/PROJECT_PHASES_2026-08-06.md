# PROJECT_PHASES — ComparaFarma

Documento de cierre y apertura de fase, a nivel de identidad visual y experiencia de producto. No repite el detalle ya registrado en `docs/program/PHASE_TRANSITION.md` (que gobierna las fases del programa completo: Fase 1 "Arquitectura y Fundamentos" → Fase 2 "Ejecución y Lanzamiento", cerrada/abierta el 2026-08-05) — este documento es más específico: registra el arco que va desde la construcción de la identidad visual de ComparaFarma hasta el inicio de la documentación de su experiencia de producto, un sub-recorrido que ocurre dentro de la Fase 2 de programa ya abierta.

---

## Historia del proyecto (resumen, en función de este cierre)

ComparaFarma construyó primero su producto (búsqueda, comparación de precios en 9 farmacias, alertas, historial) y su arquitectura de fundamentos (Enterprise, Brand, Design System, Programa) antes de tener una identidad visual definida más allá de una paleta provisional en `web/globals.css`. A partir de `VISUAL-001`, el proyecto abrió un arco de trabajo dedicado exclusivamente a construir esa identidad visual de forma ordenada: primero investigación (benchmark, tendencias, exploración de color y tipografía), después decisión (selección de dirección visual y paleta), después materialización (una experiencia visual completa aplicada a pantallas reales) y finalmente diferenciación (un sistema de componentes propio, no genérico). Ese arco es exactamente el que este documento cierra.

## Estado actual

**La Fase 1 (Brand Identity) queda oficialmente cerrada**, por declaración del comité de ComparaFarma. La Fase 2 (Product Experience) queda oficialmente abierta y ya tiene su primera experiencia materializada (Resultados, `docs/product/experiences/RESULTS.md`, sprint `PRODUCT-002`).

## Fases

### Fase 1 — Brand Identity

**Estado: Cerrada.**

**Objetivo de la fase:** construir, investigar, decidir y materializar la identidad visual completa de ComparaFarma — de forma que cualquier pantalla futura del producto pueda construirse sobre una base visual ya resuelta, sin tener que volver a decidir color, tipografía, iconografía o lenguaje de componentes en cada sprint de producto.

**Entregables aprobados por el comité:**

| Entregable | Documento |
|---|---|
| Brand Foundations | `docs/brand/BRAND_FOUNDATIONS.md` |
| Brand DNA | `docs/brand/BRAND_ARCHITECTURE.md`, `docs/brand/VISUAL_IDENTITY.md` |
| Brand Kit | `docs/brand/BRAND_GUIDELINES.md`, `docs/brand/LOGO_SYSTEM.md`, `docs/brand/COLOR_SYSTEM.md`, `docs/brand/TYPOGRAPHY_SYSTEM.md`, `docs/brand/ICONOGRAPHY_SYSTEM.md` |
| Creative Direction | `docs/brand/DESIGN_CONCEPT.md` |
| Visual Benchmark | `docs/design/VISUAL_BENCHMARK.md` |
| Visual Direction | `docs/design/VISUAL_DIRECTION.md` |
| Color Research | `docs/design/COLOR_RESEARCH.md` |
| Visual Exploration | `docs/design/VISUAL_EXPLORATION.md` |
| Brand Experience v1 | `docs/design/BRAND_EXPERIENCE_V1.md` |
| Distinctive Product Identity | `docs/design/DISTINCTIVE_PRODUCT_IDENTITY.md` (BRAND-002) |
| Signature Components | `docs/design/SIGNATURE_COMPONENTS.md` (BRAND-003) |

**No deben reabrirse** (requieren RFC específico aprobado por el comité para cualquier cambio futuro): colores, tipografía, iconografía, logo/isotipo, componentes (Signature Components y Component Library), branding, identidad visual en general.

### Fase 2 — Product Experience

**Estado: Abierta.**

**Objetivo de la fase:** documentar el comportamiento de cada experiencia de producto (qué necesita comprender y decidir la persona en cada pantalla) y materializarlo visualmente sobre la identidad ya cerrada en Fase 1 — sin volver a discutir esa identidad, y sin proponer funcionalidades nuevas fuera de las capacidades ya existentes del producto.

**Estructura documental** (`docs/product/PRODUCT_BLUEPRINT.md` es el índice): `docs/product/experiences/` (materialización por experiencia) y `docs/product/assets/` (mockups por experiencia). Ambas carpetas ya existen y ya tienen su primer contenido real — no se trata de una estructura vacía en espera, sino de una estructura activa desde el sprint `PRODUCT-002`.

**Progreso al momento de este cierre:**

| Experiencia | Estado |
|---|---|
| Resultados | Materializada (`docs/product/experiences/RESULTS.md`, `docs/product/assets/results-experience/`) |
| Búsqueda, Ficha de medicamento, Alertas de precio, Journeys | Principios ya documentados (`docs/product/SEARCH_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md`, `PRICE_ALERTS_EXPERIENCE.md`, `USER_JOURNEYS.md`); materialización visual pendiente, a decidir por el comité |

## Relación con `docs/program/`

`docs/program/PHASE_TRANSITION.md`, `PROGRAM_BOARD.md` y `MILESTONES.md` siguen siendo la fuente oficial del estado del programa completo, incluyendo workstreams que no son de identidad visual ni de experiencia de producto (Suscripciones, publicación en Google Play, Arquitectura Empresarial, etc.). Este documento no los reemplaza ni los reinterpreta — es una vista más específica, acotada a la identidad visual y a la experiencia de producto, para que ese recorrido en particular pueda entenderse sin tener que leer el estado de todo el programa.

---

**Cierre registrado:** 2026-08-06, sprint `PROJECT-001`, por declaración del comité de ComparaFarma.
