# DECISION_QUEUE — ComparaFarma

Registro de decisiones pendientes — preguntas abiertas, no decisiones ya tomadas (esas van en `DONE.md` o en el documento de origen correspondiente, ej. `docs/design/DESIGN_DECISION_LOG.md`).

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-DQ-001 |
| **Nombre** | DECISION_QUEUE.md |
| **Dominio** | Gestión de Programa (`docs/program/`) |
| **Estado** | Activo |
| **Versión** | 1.2 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager / PMO Director |
| **Nivel de Gobierno** | De decisión operativa |
| **Clasificación** | Registro de Decisiones Pendientes |
| **Fuente Oficial** | Este documento, para la vista consolidada de preguntas abiertas |
| **Documentos de los que depende** | `docs/design/*`, `docs/brand/*`, `docs/release/PLAY_CONSOLE_CHECKLIST.md`, `docs/analysis/PROJECT_INVENTORY.md`, `docs/product/DECISION_LOG.md` |
| **Pregunta que responde** | ¿Qué decisiones siguen pendientes, y quién debe tomarlas? |

---

## 2. Propósito

Hacer visibles, en un solo lugar, todas las preguntas abiertas del programa que requieren una decisión (típicamente del CEO/fundador) para poder avanzar — sin que cada una quede escondida dentro de su documento de origen.

---

## 3. Alcance

**Este documento define:** preguntas abiertas, con contexto, opciones conocidas (si las hay) y quién debe decidir.

**Este documento NO define:** decisiones ya tomadas (→ `DONE.md` o el documento de origen), ni resuelve ninguna de las preguntas aquí listadas — este documento no decide, solo registra que algo está pendiente de decidirse.

---

## 4. Contenido principal

| ID | Decisión pendiente | Contexto | Quién decide | Fuente |
|---|---|---|---|---|
| DQ-001 | Logo definitivo | `docs/design/DESIGN_EXPLORATION.md` registra 3 familias conceptuales exploradas (Brújula, Mapa, Constelación) sin selección; ninguna evaluada todavía contra la matriz de criterios de `DESIGN_CONCEPT.md` §4.8 | CEO/fundador (tras evaluación de diseño) | `docs/design/DESIGN_EXPLORATION.md` |
| DQ-002 | Sistema de colores | `COLOR_SYSTEM` no existe todavía; el board de exploración (`concept-board-v1.png`) tiene "notas cromáticas exploratorias" que su propio documento de origen advierte explícitamente que no deben confundirse con una paleta ya decidida | CEO/fundador | `docs/design/DESIGN_EXPLORATION.md` (riesgo #1) |
| DQ-003 | Catálogo comercial de planes Premium para producción | No existe ningún plan vendible hoy (solo un plan placeholder "cortesía", no vendible); sin esto, el botón de upgrade no aparece en producción | CEO/fundador | `docs/analysis/PROJECT_INVENTORY.md` §3, §10; recurrente en `docs/product/DECISION_LOG.md` desde la Fase 1 de Subscription Platform |
| DQ-004 | Landing page — ¿es un activo separado del sitio web ya operativo (`app-compara-farma-web.vercel.app`), o el mismo sitio cumple esa función? | `docs/brand/VISUAL_IDENTITY.md` lista "landing" como canal de aplicación junto a "sitio web", como si fueran dos cosas distintas, sin aclarar la diferencia | CEO/CTO | `docs/brand/VISUAL_IDENTITY.md` (canales de aplicación) |
| DQ-005 | Estrategia de Analytics más allá del evento único actual | Hoy solo existe un evento instrumentado en mobile (`medication_search`); `docs/product/ROADMAP.md` declara "Analytics" como capacidad necesaria para el Objetivo 1 (lanzar un producto confiable) sin especificar qué eventos adicionales se necesitan | CEO/CTO | `docs/release/PRODUCTION_READINESS_V2.md` §7; `docs/product/ROADMAP.md` |
| DQ-006 | Video promocional para la ficha de Google Play | No se encontró ningún documento que confirme que existe, que esté en desarrollo, o que se haya decidido no incluirlo — pregunta genuinamente sin evidencia en ningún sentido | CEO/CTO | Sin fuente — incluido por señalamiento expreso, sin antecedente documental |
| DQ-007 | Ratificación formal del CEO sobre `BRAND_FOUNDATIONS.md`, `BRAND_ARCHITECTURE.md` y los 4 documentos de `docs/enterprise/` | Los 6 documentos declaran explícitamente su aprobación como "Pendiente (CEO/fundador)" | CEO/fundador | `docs/brand/BRAND_FOUNDATIONS.md` §22-23; `docs/enterprise/*` |
| DQ-008 | Confirmación de cierre del formulario de Data Safety en Play Console | Última evidencia disponible (2026-07-31) lo marca "pendiente"; sin documento posterior que confirme su cierre | CEO/fundador (acción exclusiva en Play Console) | `docs/release/PRODUCTION_READINESS_V2.md` §6, §10 |
| DQ-009 | Mecanismo de submit a Producción: build/subida manual del AAB (método hoy preferido) vs. `eas submit` (que hoy enviaría al track "internal" por configuración de `eas.json`) | Sin definir cuál se usará para este lanzamiento | CTO | `docs/release/PRODUCTION_READINESS_V2.md` §3, §6 |
| DQ-010 | Consistencia entre la política de privacidad y el formulario de Data Safety respecto de PostHog | `docs/release/PLAY_CONSOLE_CHECKLIST.md` señala textualmente que la política de privacidad actual no menciona PostHog, lo que crearía inconsistencia si se declara analytics en Data Safety | CEO/CTO (antes de completar Data Safety, DQ-008) | `docs/release/PLAY_CONSOLE_CHECKLIST.md` |
| DQ-011 | Confirmación de si la migración SQL del Registro Canónico (CFM-ID) corrió en producción | No se encontró evidencia concluyente en esta revisión | CTO (verificación directa en Supabase) | `docs/analysis/PROJECT_INVENTORY.md` §3 |
| DQ-012 | Confirmación de si `API_SECRET_KEY` está configurada en el Vercel de producción de `api/` | Determina si el endpoint `?debug=1` queda abierto a terceros | CTO (verificación directa en Vercel) | `docs/release/PRODUCTION_READINESS_V2.md` §3, §5 |
| DQ-013 | Naming/descriptor para futuros productos dirigidos a Profesionales y Empresas (herramientas médicas, API Comercial, Dashboards, Observatorio Farmacéutico) | `docs/brand/BRAND_ARCHITECTURE.md` recomienda no crear marcas nuevas, pero no decide qué descriptor usar — decisión explícitamente diferida hasta que exista el producto real | CEO/fundador, cuando el producto correspondiente pase de previsto a en desarrollo | `docs/brand/BRAND_ARCHITECTURE.md` §4.6 |
| DQ-014 | Resolución de la tensión "Marketplace futuro" (Digital Asset Register) vs. posicionamiento "no somos un marketplace" (Visión 2030, Brand Foundations) | Ningún documento reconcilia ambas afirmaciones | CEO/fundador | `docs/brand/BRAND_ARCHITECTURE.md` §4.8 |
| DQ-015 | Autorización para iniciar la implementación de la Épica 1 (Identity Foundation) | La cadena completa de arquitectura de identidad (`PLATFORM-001` a `SPIKE-001`) está diseñada, revisada por el comité y validada con evidencia real de producción. El Spike recomienda continuar de inmediato; explícitamente no se ha implementado nada de `EPIC-01-IDENTITY_FOUNDATION.md` todavía, a la espera de esta aprobación | CEO/fundador | `docs/execution/SPIKE-001_IDENTITY_ENTITLEMENT_POC.md`; `docs/product/DECISION_LOG.md` (2026-08-06/07) |
| DQ-016 | Paleta de colores por farmacia oficial en Web: ¿la de `globals.css` (usada en Home) o la de `constants/pharmacies.ts` (usada en el resto del sitio)? | Ninguna documentada como "la correcta" en `docs/design/brand/COLOR_SYSTEM.md`; bloquea la Fase A de implementación Web descrita en `docs/archive/plans/WEB_IMPLEMENTATION_PLAN_2026-08-06.md` §5 | CTO/Product | `docs/archive/plans/WEB_IMPLEMENTATION_PLAN_2026-08-06.md` §8 |
| DQ-017 | Tratamiento de `DEMO_PRICES` hardcodeado en Home de Web | Marcar como ilustrativo, alimentar con datos reales, o eliminar — riesgo de percepción de falta de transparencia si se confunde con datos reales | CTO/Product | `docs/archive/plans/WEB_IMPLEMENTATION_PLAN_2026-08-06.md` §7-8 |
| DQ-018 | ¿Se abre un sprint de documentación dedicado para instanciar Screen Templates/Componentes/Tokens concretos (mobile + web), antes de que cualquier Fase 2 de implementación visual pueda decir que "implementa el Design System"? | Hoy `docs/design/system/` es arquitectura conceptual sin ninguna instanciación concreta (ningún token, componente o plantilla con nombre y valor real) | CTO/Product | `docs/archive/plans/WEB_IMPLEMENTATION_PLAN_2026-08-06.md` §8 |
| DQ-019 | ¿Se documenta formalmente la experiencia de `/cuenta`, `/admin` y `/mi-receta` en `docs/product/` (PHASE 3 de Product Experience), o se acepta que sigan gobernadas solo por RFCs técnicos y `DECISION_LOG.md`? | Sin esta decisión, esas superficies quedan sin especificación de experiencia equivalente a la ya cerrada PHASE 2 (Search/Results/Medication Detail/Price Alerts) | CTO/Product | `docs/archive/plans/WEB_IMPLEMENTATION_PLAN_2026-08-06.md` §8 |
| DQ-020 | ¿Se acepta la asimetría de manejo de error de `API_URL` entre Mobile (falla explícita si falta `EXPO_PUBLIC_API_URL`) y Web (cae silenciosamente a una URL de producción hardcodeada si falta `API_URL`), o Web también debe fallar explícitamente? | Decisión de diseño no tomada conscientemente ni documentada para Web | CTO | `docs/archive/plans/WEB_IMPLEMENTATION_PLAN_2026-08-06.md` §7-8 |

---

## 5. Relaciones

Este documento se alimenta de decisiones pendientes ya señaladas explícitamente en `docs/design/`, `docs/brand/`, `docs/release/` y `docs/analysis/`. Cuando cualquiera de estas preguntas se resuelva, la decisión debe registrarse primero en su documento de origen (por ejemplo, `docs/design/DESIGN_DECISION_LOG.md` para DQ-001/DQ-002) y luego reflejarse aquí como resuelta, moviéndose eventualmente a `docs/program/DONE.md`.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Decisiones de diseño pendientes | `docs/design/DESIGN_EXPLORATION.md`, `DESIGN_DECISION_LOG.md` | ✔ (DQ-001, DQ-002) | — |
| Decisiones comerciales pendientes | `docs/product/DECISION_LOG.md`, `docs/analysis/PROJECT_INVENTORY.md` | ✔ (DQ-003) | — |
| Decisiones de release pendientes | `docs/release/PRODUCTION_READINESS_V2.md`, `PLAY_CONSOLE_CHECKLIST.md` | ✔ (DQ-008 a DQ-012) | — |
| Decisiones de arquitectura de marca pendientes | `docs/brand/BRAND_ARCHITECTURE.md` | ✔ (DQ-013, DQ-014) | — |

---

## 7. Gobierno

Este documento no decide nada — solo registra que algo está pendiente de decidirse. Cuando una decisión se toma, debe retirarse de este documento y registrarse en el documento de origen correspondiente y en `docs/program/DONE.md`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

`docs/design/DESIGN_DECISION_LOG.md`, `docs/product/DECISION_LOG.md`, `docs/program/RISKS.md`, `PROGRAM_BOARD.md`, `DONE.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial, con 14 decisiones pendientes reconstruidas desde 5 dominios distintos. | Ver Matriz de Trazabilidad (§6) |
| 1.1 | 2026-08-07 | Activo | Pendiente (CEO/fundador) | Agregada DQ-015 (autorización para iniciar la Épica 1, tras el cierre de `SPIKE-001`). | `docs/execution/SPIKE-001_IDENTITY_ENTITLEMENT_POC.md`, `docs/product/DECISION_LOG.md` |
| 1.2 | 2026-08-15 | Activo | Pendiente (CEO/fundador) | Agregadas DQ-016 a DQ-020, transferidas desde `docs/web/WEB_IMPLEMENTATION_PLAN.md` antes de archivar ese documento (Domain/Documentation Governance Cleanup). La Decisión Pendiente 5 original de ese plan (colisión de numeración RFC-002) no se transfiere por estar ya resuelta (RFC-006, ver `docs/technology/decisions/rfc/`). | `docs/archive/plans/WEB_IMPLEMENTATION_PLAN_2026-08-06.md` |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Consolidación de decisiones pendientes de programa | Enterprise Program Manager / PMO Director | `docs/program/DECISION_QUEUE.md` v1.0 (este documento) |
| 2026-08-07 | Registro de DQ-015 tras cierre de `SPIKE-001` | Enterprise Program Manager / PMO Director | `docs/program/DECISION_QUEUE.md` v1.1 (este documento) |
| 2026-08-15 | Transferencia de pendientes de `WEB_IMPLEMENTATION_PLAN.md` antes de archivarlo | CTO (rol asumido, Documentation Governance Cleanup) | `docs/program/DECISION_QUEUE.md` v1.2 (este documento) |

**Pendiente de definición:** ninguna aprobación formal del CEO/fundador registrada todavía.
