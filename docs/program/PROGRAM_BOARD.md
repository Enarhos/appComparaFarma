# PROGRAM_BOARD — ComparaFarma

**Este es el documento con el que debe empezar toda sesión de trabajo.** Es una vista ejecutiva, no un registro detallado — cada afirmación aquí tiene su detalle y su evidencia completa en `MASTER_BACKLOG.md`, `RISKS.md`, `DECISION_QUEUE.md`, `MILESTONES.md`, `DONE.md` o en el dominio de origen correspondiente.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-BRD-001 |
| **Nombre** | PROGRAM_BOARD.md |
| **Dominio** | Gestión de Programa (`docs/program/`) |
| **Estado** | Activo |
| **Versión** | 1.2 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager / PMO Director |
| **Nivel de Gobierno** | De decisión operativa — se actualiza cada sesión, a diferencia de los documentos Estratégicos o Fundacionales |
| **Clasificación** | Documento de Gobierno de Programa |
| **Fuente Oficial** | Este documento es la fuente oficial del *estado consolidado* del programa; no es fuente oficial de ningún contenido de dominio (ver Alcance) |
| **Documentos de los que depende** | Todos los documentos de `docs/program/` y, transitivamente, de todos los dominios (`docs/enterprise/`, `docs/brand/`, `docs/design/`, `docs/product/`, `docs/release/`, `docs/analysis/`) |
| **Documentos que gobierna** | Ninguno; es una vista de consolidación, no una fuente de contenido |
| **Última actualización** | 2026-08-07 (actualización parcial — ver nota en §4.4) |
| **Pregunta que responde** | ¿Dónde estamos, qué se terminó, qué estamos haciendo, qué viene después, qué está bloqueado, cuáles son las prioridades? |

---

## 2. Propósito

Dar, en una sola lectura, el estado real del programa completo — sin necesidad de abrir los ocho dominios documentales por separado. Toda cifra o estado declarado aquí debe poder verificarse en `MASTER_BACKLOG.md`, `RISKS.md`, `DECISION_QUEUE.md` o el dominio de origen.

---

## 3. Alcance

**Este documento define:** el estado general del programa, el sprint activo, el estado de cada área/workstream, los bloqueos vigentes, las prioridades recomendadas, los próximos hitos esperados y un set de indicadores generales.

**Este documento NO define:** el detalle de cada iniciativa (→ `MASTER_BACKLOG.md`), el detalle del sprint activo (→ `CURRENT_SPRINT.md`), el detalle de cada riesgo (→ `RISKS.md`), el detalle de cada decisión pendiente (→ `DECISION_QUEUE.md`), ni el historial de logros (→ `MILESTONES.md`, `DONE.md`).

---

## 4. Contenido principal

### 4.1 Estado General

**La Fase 1 del programa (Arquitectura y Fundamentos) quedó formalmente cerrada el 2026-08-05.** Los cuatro dominios que la componen — Arquitectura Empresarial, Arquitectura de Marca, Arquitectura de Diseño y Gobierno del Programa — tienen su construcción base completa: 4 documentos de Enterprise, 5 documentos de Brand, el dominio de proceso de Design, y el propio dominio `docs/program/` (9 documentos) existen y son consistentes entre sí. Ninguno de los documentos de Enterprise o Brand tiene ratificación formal del CEO/fundador todavía — esa ratificación queda registrada como ítem transversal pendiente (`DECISION_QUEUE.md`, DQ-007), **no como bloqueante del cierre de esta fase**: el objetivo de Fase 1 era construir los fundamentos, no obtener su aprobación final. Detalle completo del cierre en `docs/program/PHASE_TRANSITION.md`.

El programa entra ahora en la **Fase 2: Ejecución y Lanzamiento**, con el sprint activo **"Production Release 1.0"** (ver §4.3 y `docs/program/CURRENT_SPRINT.md`). El producto real (mobile + web + api) permanece en el estado alcanzado el 2026-08-03 con el cierre de la Fase 2 corregida de Subscription Platform (Flow): **mobile/ salió de Prueba Cerrada de Google Play el 2026-08-08** (confirmación del CTO en sesión de chat, 2026-08-08 — ver `CLAUDE.md`, sección "Actualización de estado (2026-08-08)"; sin artefacto de Play Console verificado de forma independiente en este repositorio) — el bloqueante histórico de Data Safety queda superado por este cierre.

El foco declarado del programa cambia ahora desde "construir arquitectura" hacia: **Identidad Visual, Google Play, Producto (calidad de lanzamiento) y Plataforma Web** — los 4 workstreams del sprint activo — más la comercialización y evolución de producto que sigue corriendo en paralelo.

### 4.2 Programa

**ComparaFarma — Plataforma de Inteligencia Farmacéutica.** (Nombre y posicionamiento consolidados en `docs/brand/BRAND_ARCHITECTURE.md` §4.2 y `docs/strategy/VISION_2030.md`.)

### 4.3 Sprint Actual

**Production Release 1.0.** Ver detalle completo en `docs/program/CURRENT_SPRINT.md`. Objetivo: llevar ComparaFarma a Producción en Google Play con una identidad visual profesional y una propuesta de valor consolidada, a través de 4 workstreams: A) Identidad Visual, B) Google Play, C) Producto, D) Plataforma Web.

El sprint anterior, **Sprint de Gobierno — Inicialización de `docs/program/`**, cerró formalmente el 2026-08-05 con Estado: Completed. Su registro de cierre (objetivo alcanzado, entregables, lecciones, trabajo pendiente) vive en `docs/program/CURRENT_SPRINT.md` §4 y está resumido en `docs/program/DONE.md`.

### 4.4 Áreas del Programa — Estado de cada una

Corte al 2026-08-05, ya con el cierre de Fase 1. Los dominios de Fase 1 (Enterprise, Brand, Design, Program Governance) tienen su **construcción base completa**; lo que continúa en cada uno pasa a Fase 2 (si condiciona el sprint "Production Release 1.0") o Fase 3 (si no es requerido para el lanzamiento) — ver `MASTER_BACKLOG.md` para la reclasificación completa por fase.

| Área / Workstream | Estado | Fase | Detalle |
|---|---|---|---|
| **Enterprise** | 🟡 En Elaboración | Fase 1 completada (construcción) → continuación en Fase 3 | 4 documentos escritos (BCM, BS, EDM, DAR), todos v1.0/v2.0 Draft. Próximo, por acuerdo explícito en `docs/actas/20260803.md`: Architecture Traceability Matrix → Product Portfolio → Operating Model → Enterprise Roadmap → Enterprise Glossary — ninguno de esos 5 existe todavía, y ninguno es bloqueante para el lanzamiento. |
| **Brand** | 🟡 Draft completo, sin ratificar | Fase 1 completada (construcción) → Logo/Color/Typography/Iconography pasan a Fase 2 | 5 documentos escritos y completos (`BRAND_AUDIT`, `BRAND_FOUNDATIONS`, `VISUAL_IDENTITY`, `DESIGN_CONCEPT`, `BRAND_ARCHITECTURE`). Ninguno tiene aprobación formal del CEO/fundador. Los sistemas visuales (Workstream A del sprint activo) son ahora trabajo de Fase 2. |
| **Design** | 🟡 Exploración abierta | Fase 1 completada (dominio de proceso) → evaluación/selección pasa a Fase 2 | 1 exploración registrada (EXP-001, 3 familias conceptuales: Brújula, Mapa, Constelación — ninguna seleccionada), 1 decisión de proceso (DD-001: concepto "Orientación" aprobado para guiar el trabajo, no como decisión final de marca). La evaluación y selección final es el primer paso de Workstream A. |
| **Launch (Google Play)** | 🟡 Prueba Cerrada finalizada (2026-08-08) | Fase 2 — Workstream B activo | Salida de Prueba Cerrada confirmada por el CTO en chat (confirmación del CTO en sesión de chat, 2026-08-08 — ver `CLAUDE.md`, sección "Actualización de estado (2026-08-08)"; sin artefacto de Play Console verificado de forma independiente en este repositorio). Falta confirmar en Play Console la publicación efectiva en Producción (Acción 8 de `GO_LIVE_EXECUTION_PLAN.md`). Bloqueantes históricos B-1/B-2/B-3/B-4 superados por este cierre. |
| **Product / Engineering** | 🟢 Activo intermitente | Fase 1 completada (entregas cerradas) → QA/checklist de Fase 2 (Workstream C) | Última entrega: Subscription Platform Fase 2 corregida (Flow), 2026-08-03. Sprints E/A/C/D de la propuesta 0-F implementados; B bloqueado (fuente de bioequivalencia), F en backlog. Revisión final de calidad y checklist de producción son ahora Workstream C. |
| **Platform (Web/API)** | 🟢 Operativo | Fase 1 completada → integración de identidad visual en Fase 2 (Workstream D) | Web en producción pública, API operativa (10 funciones), panel `/admin` operativo. |
| **Growth** | ⚪ Mayormente Backlog | Fase 3 | Favoritos/historial/búsquedas recientes ya operativos (mobile). Bioequivalentes bloqueado, IA/escaneo de receta en fase de idea, push notifications sin código — ninguno requerido para el lanzamiento. |
| **Commercial** | 🟡 Motor listo, sin catálogo | Motor: Fase 1 completada · Catálogo: Fase 3 | Motor de Suscripciones operativo en backend; catálogo comercial de planes vendibles vacío (solo plan placeholder "cortesía", no vendible); precios y modelo comercial real sin definir. No es uno de los 4 workstreams explícitos del sprint activo, pero condiciona la "propuesta de valor consolidada" de su objetivo. |
| **Program Governance** | ✅ Fase 1 completada | Fase 1 completada | Dominio `docs/program/` (9 documentos) creado el 2026-08-05; este mismo cierre de Fase 1 y la transición a Fase 2 (`PHASE_TRANSITION.md`) son su entrega final de Fase 1. |
| **Identity Architecture** | 🟡 Diseño y validación completos, sin implementar | Fase 2 (nuevo workstream, no listado en §4.3) | Cadena de 8 sprints (`PLATFORM-001` a `SPIKE-001`) diseñó y validó con evidencia real la convergencia de identidad Mobile/Web/Backend — ver detalle en `CLAUDE.md` ("Estado de la Documentación de Gobierno") y `docs/product/DECISION_LOG.md` (2026-08-06/07). Cero código implementado. Bloqueada por DQ-015 (aprobación del CEO). |

**Nota sobre esta fila:** agregada el 2026-08-07 solo para reflejar este workstream nuevo. El resto de esta tabla sigue con corte al 2026-08-05 y no incorpora otros sprints corridos el 2026-08-06/07 (`RELEASE-003`, `PROJECT-001`, `PRODUCT-003`, `RELEASE-004`, `PLATFORM-001..SPIKE-001`) — requiere una reconciliación completa que no se hizo en esta sesión.

Leyenda: 🟢 Operativo/Activo · 🟡 En curso o parcial · 🔴 Bloqueado · ⚪ Mayormente sin iniciar · ✅ Completado.

### 4.5 Bloqueos

| # | Bloqueo | Área afectada | Severidad |
|---|---|---|---|
| B-1 | Data Safety en Play Console sin confirmación de cierre desde 2026-07-31 | Launch | Crítica |
| B-2 | **Resuelto (2026-08-08)** — `mobile/` salió de Prueba Cerrada (confirmación del CTO en sesión de chat, 2026-08-08 — ver `CLAUDE.md`, sección "Actualización de estado (2026-08-08)"; sin artefacto de Play Console verificado de forma independiente en este repositorio), ya no impide evolución de producto móvil ni la verificación end-to-end de Suscripciones | Product, Commercial | — |
| B-3 | Sin fuente de datos de bioequivalencia confiable e integrada | Growth | Media |
| B-4 | Catálogo comercial de planes vacío — sin precios ni plan vendible definido | Commercial | Alta |
| B-5 | Ninguna decisión de marca o diseño (identidad, logo, color) tiene ratificación formal del CEO | Brand, Design | Media |

Detalle completo, impacto, probabilidad y mitigación de cada uno en `docs/program/RISKS.md`. Mapeo al sprint activo: B-1 → Workstream B (Google Play); B-2 → prerequisito de Workstream A (Identidad Visual); B-3 → fuera de alcance del sprint (Fase 3, Growth); B-4 → prerequisito transversal de Workstream A/B; B-5 → riesgo transversal, no bloqueante de ningún workstream específico.

### 4.6 Prioridades

Prioridades vigentes para el sprint activo "Production Release 1.0" (ver `docs/program/CURRENT_SPRINT.md`):

1. **Resolver Data Safety en Play Console** (acción exclusiva del CEO, ~1h según `docs/release/PRODUCTION_BLOCKERS_PLAN.md`) — Workstream B, sigue siendo el bloqueo crítico único del programa.
2. **Evaluar las 3 familias conceptuales de diseño contra la matriz de criterios de `DESIGN_CONCEPT.md` §4.8 y seleccionar dirección visual final** — Workstream A, primer paso; condiciona Logo/Color/Typography/Iconography y, después, los assets de Google Play.
3. **Completar Checklist de Producción y Revisión final de calidad** (`docs/release/PLAY_CONSOLE_CHECKLIST.md`, `PRODUCTION_READINESS_V2.md`) — Workstream C.
4. **Integrar la identidad visual resultante en la Plataforma Web** — Workstream D, depende de Workstream A.
5. *(Transversal, fuera de los 4 workstreams explícitos pero relevante para la "propuesta de valor consolidada")* Definir el catálogo comercial real de planes Premium — decisión pendiente del CEO (`DECISION_QUEUE.md`, DQ-003).
6. *(Transversal, no bloqueante)* Ratificación del CEO sobre los documentos de Enterprise y Brand (`DECISION_QUEUE.md`, DQ-007) y continuación de la cadena de Arquitectura Empresarial (Architecture Traceability Matrix) — ambos quedan en Fase 3, sin fecha comprometida.
7. *(Nuevo, 2026-08-07)* Decidir si se autoriza el inicio de la implementación de la Épica 1 (Identity Foundation) — `DECISION_QUEUE.md`, DQ-015. Arquitectura ya diseñada y validada con PoC real; cero código implementado hasta esta decisión.

### 4.7 Próximos Hitos

- Selección final de dirección visual (Logo System, Color System, Typography System, Iconography) — Workstream A, sin fecha comprometida.
- Confirmación del cierre de Data Safety — Workstream B, sin fecha comprometida, acción pendiente del CEO.
- Assets completos de Google Play (icono, feature graphic, screenshots, video, store listing, ASO básico) — Workstream B.
- Checklist de Producción 100% verde y validaciones finales (analytics, CFM-ID, `API_SECRET_KEY`) — Workstream C.
- Landing/sitio web integrado con la nueva identidad visual — Workstream D.
- *(Fuera del sprint activo, seguimiento continuo)* Definición del primer plan comercial real vendible (Commercial, Fase 3).

### 4.8 Indicadores Generales

| Indicador | Valor |
|---|---|
| Documentos de Arquitectura Empresarial escritos / ratificados por CEO | 4 / 0 |
| Documentos de Arquitectura de Marca escritos / ratificados por CEO | 5 / 0 |
| Exploraciones de diseño abiertas / decisiones de dirección visual final | 1 / 0 |
| Farmacias integradas y operativas | 9 / 9 |
| Bloqueantes históricos de publicación Google Play resueltos | 3 / 4 (pendiente: Data Safety) |
| Fases de Subscription Platform implementadas / totales planeadas | 2 / 4 (Fase 3 Apple y Fase 4 Comercial en backlog) |
| Sprints de la propuesta de negocio 0–F completados | 4 / 6 (E, A, C, D — B bloqueado, F en backlog) |
| Tests verdes reportados en `api/` (último cierre de sprint, CF-127) | 172 |
| Fases de programa cerradas / totales declaradas | 1 / 2 (Fase 1 cerrada 2026-08-05; Fase 2 activa) |
| Workstreams de "Production Release 1.0" con criterios de término cumplidos | 0 / 4 (A, B, C, D — sprint recién iniciado) |

---

## 5. Relaciones

Este documento consolida, sin duplicar en detalle, el estado de: `docs/enterprise/*`, `docs/brand/*`, `docs/design/*`, `docs/product/EPICS.md`/`BACKLOG_PRODUCT.md`/`ROADMAP.md`, `docs/release/PRODUCTION_READINESS_V2.md`, `docs/analysis/PROJECT_INVENTORY.md` y `docs/actas/`. Se relaciona con el resto de `docs/program/` como su vista resumen — cada sección de este documento tiene su contraparte de detalle en otro archivo del mismo dominio.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Estado de Enterprise | `docs/enterprise/*`, `docs/actas/20260803.md` | ✔ resumido (§4.4) | — |
| Estado de Brand/Design | `docs/brand/*`, `docs/design/*` | ✔ resumido (§4.4) | — |
| Estado de Launch/Google Play | `docs/release/PRODUCTION_READINESS_V2.md` | ✔ resumido (§4.4, §4.5) | Clasificación C ("no recomendable publicar todavía") citada íntegra en la fuente |
| Estado de Product/Engineering | `docs/product/EPICS.md`, `BACKLOG_PRODUCT.md`, `DECISION_LOG.md` | ✔ resumido (§4.4) | — |
| Estado de Platform | `docs/analysis/PROJECT_INVENTORY.md` | ✔ resumido (§4.4) | — |
| Bloqueos | `docs/program/RISKS.md` | ✔ referenciado (§4.5) | Detalle completo vive en `RISKS.md` |
| Decisiones pendientes | `docs/program/DECISION_QUEUE.md` | Referenciado (§4.6) | — |
| Cierre formal de Fase 1 y transición a Fase 2 | `docs/program/PHASE_TRANSITION.md` | ✔ referenciado (§4.1, §4.3) | Resumen ejecutivo completo del cierre vive en ese documento, no se duplica aquí |

---

## 7. Gobierno

Este documento no reemplaza ningún dominio de contenido — es una vista de consolidación que debe actualizarse cada vez que cambie el estado de cualquier workstream. Cuando exista una discrepancia entre este tablero y la fuente de origen de cualquier dato, prevalece la fuente original.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

`docs/program/README.md`, `MASTER_BACKLOG.md`, `CURRENT_SPRINT.md`, `ROADMAP.md`, `MILESTONES.md`, `RISKS.md`, `DECISION_QUEUE.md`, `DONE.md`, `PHASE_TRANSITION.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial del tablero ejecutivo, reconstruyendo el estado real del programa a partir de toda la documentación existente. | Ver Matriz de Trazabilidad (§6) |
| 1.1 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Cierre formal de Fase 1 (Arquitectura y Fundamentos) y apertura de Fase 2 (Ejecución y Lanzamiento): Estado General, Áreas del Programa, Prioridades, Próximos Hitos e Indicadores actualizados; Sprint Actual reemplazado por "Production Release 1.0". | `docs/program/PHASE_TRANSITION.md`, `MASTER_BACKLOG.md`, `MILESTONES.md`, `CURRENT_SPRINT.md` |
| 1.2 | 2026-08-07 | Activo | Pendiente (CEO/fundador) | Actualización parcial: agregada la fila "Identity Architecture" en §4.4, prioridad #7 y nota explícita de que el resto de la tabla sigue con corte al 2026-08-05 (no se reconciliaron los demás sprints del 2026-08-06/07). | `docs/execution/SPIKE-001_IDENTITY_ENTITLEMENT_POC.md`, `docs/product/DECISION_LOG.md`, `docs/program/DECISION_QUEUE.md` (DQ-015) |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Inicialización del dominio de gobierno de programa y de su tablero ejecutivo | Enterprise Program Manager / PMO Director / Portfolio Manager | `docs/program/PROGRAM_BOARD.md` v1.0 (este documento) |
| 2026-08-05 | Cierre formal de Fase 1 y transición a Fase 2 | Enterprise Program Manager / PMO Director | `docs/program/PROGRAM_BOARD.md` v1.1 (este documento) |
| 2026-08-07 | Actualización parcial: nuevo workstream Identity Architecture | Enterprise Program Manager / PMO Director | `docs/program/PROGRAM_BOARD.md` v1.2 (este documento) |

**Pendiente de definición:** ninguna aprobación formal del CEO/fundador registrada todavía. Este tablero debe actualizarse al cierre de cada sesión de trabajo (ver `docs/program/README.md` §4.5).
