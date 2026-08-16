# CURRENT_SPRINT — ComparaFarma

Contiene únicamente el trabajo activo del programa. No es un historial (→ `DONE.md`) ni un backlog completo (→ `MASTER_BACKLOG.md`).

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-SPR-001 |
| **Nombre** | CURRENT_SPRINT.md |
| **Dominio** | Gestión de Programa (`docs/program/`) |
| **Estado** | Activo |
| **Versión** | 1.1 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager |
| **Nivel de Gobierno** | De decisión operativa — normalmente se reemplaza por completo cada vez que cambia el sprint activo (su cierre se registra en `DONE.md`). Excepción registrada en esta versión: por tratarse de un cierre de Fase de programa, el sprint recién cerrado se documenta íntegramente en §4.1 antes de introducir el nuevo sprint activo en §4.2 |
| **Clasificación** | Documento de Ejecución de Programa |
| **Fuente Oficial** | Este documento, para el sprint activo actual |
| **Documentos de los que depende** | `docs/program/MASTER_BACKLOG.md`, `docs/brand/*`, `docs/design/*`, `docs/enterprise/README.md` |
| **Pregunta que responde** | ¿Qué se está haciendo exactamente ahora mismo? |

---

## 2. Propósito

Declarar, sin ambigüedad, cuál es el trabajo activo del programa en este momento — a diferencia de `MASTER_BACKLOG.md`, que contiene todo lo que existe, este documento contiene solo lo que está en curso ahora.

---

## 3. Alcance

**Este documento define:** el sprint activo, su objetivo, duración, entregables, tareas, riesgos y criterios de término.

**Este documento NO define:** trabajo futuro no iniciado (→ `MASTER_BACKLOG.md`), trabajo ya cerrado (→ `DONE.md`), ni decisiones estratégicas de contenido (→ el dominio correspondiente).

---

## 4. Contenido principal

### 4.1 Sprint cerrado: Inicialización del dominio de gobierno de programa (`docs/program/`)

**Estado: Completed** (cerrado el 2026-08-05, misma sesión en que se creó). Registrado aquí de forma excepcional por instrucción directa del CEO al cerrar la Fase 1 del programa — el resumen equivalente vive también en `docs/program/DONE.md` §4.6.

**Objetivo alcanzado:** sí, íntegramente. Se creó `docs/program/` como centro oficial de gobierno operativo del programa, capaz de responder dónde está el proyecto, qué se terminó, qué está activo, qué está bloqueado, cuáles son las prioridades y qué decisiones siguen pendientes — consolidando evidencia de Enterprise, Brand, Design, Product, Release y Analysis sin inventar ninguna iniciativa nueva.

**Entregables completados (9/9):**

1. `docs/program/README.md` — chárter del dominio.
2. `docs/program/PROGRAM_BOARD.md` — tablero ejecutivo.
3. `docs/program/MASTER_BACKLOG.md` — backlog consolidado por workstream.
4. `docs/program/CURRENT_SPRINT.md` — este documento.
5. `docs/program/ROADMAP.md` — evolución del programa por workstream.
6. `docs/program/MILESTONES.md` — hitos alcanzados.
7. `docs/program/RISKS.md` — registro oficial de riesgos.
8. `docs/program/DECISION_QUEUE.md` — decisiones pendientes.
9. `docs/program/DONE.md` — memoria histórica de logros.

**Lecciones relevantes:**

- El programa había construido tres capas de arquitectura (Enterprise, Brand, Design) en paralelo, sin ningún mecanismo que las consolidara operativamente — cada dominio era internamente coherente, pero nadie tenía, antes de este sprint, una vista única de todo el programa a la vez. Ese vacío es el que este sprint cerró.
- Ningún documento estratégico o de arquitectura tiene, a la fecha, ratificación formal del CEO/fundador — patrón recurrente en Enterprise y Brand que este sprint no resolvió (no era su objetivo) pero sí hizo visible de forma consolidada (`DECISION_QUEUE.md`, DQ-007).
- El concepto de "Sprint" de programa, hasta este sprint, solo se usaba para ingeniería de producto (`docs/product/`) — nunca para gobierno documental. Aplicarlo aquí permitió detectar bloqueos reales (Data Safety, catálogo comercial) que estaban dispersos entre `docs/release/` y `docs/analysis/` sin una vista conjunta.
- Consolidar bloqueos y riesgos de 4 documentos de origen distintos en `RISKS.md` confirmó que el bloqueante crítico real del programa sigue siendo uno solo (Data Safety, R-001/B-1) — no una lista larga de pendientes de igual peso.

**Trabajo pendiente (trasladado a Fase 2/Fase 3, no a este sprint):** ratificación del CEO sobre Enterprise/Brand (DQ-007); resolución de Data Safety (DQ-008); definición del catálogo comercial (DQ-003); selección de dirección visual final (DQ-001/DQ-002). Ninguno se resolvió en este sprint — todos quedan registrados en `docs/program/DECISION_QUEUE.md` y reclasificados por fase en `docs/program/MASTER_BACKLOG.md`.

---

### 4.2 Sprint activo: Production Release 1.0

**Objetivo:** llevar ComparaFarma a Producción en Google Play con una identidad visual profesional y una propuesta de valor consolidada.

**Duración:** sin fecha de cierre comprometida en la documentación disponible — no se inventa ninguna.

**Workstreams:**

**A. Identidad Visual**

| Entregable | Estado | Dependencia | Fuente |
|---|---|---|---|
| Evaluación de las 3 familias conceptuales (Brújula, Mapa, Constelación) contra la matriz de criterios | ⬜ No iniciado | EXP-001 | `docs/archive/design/explorations/DESIGN_EXPLORATION.md` |
| Selección final de dirección visual | ⬜ Pendiente | Evaluación anterior | `docs/program/DECISION_QUEUE.md` DQ-001 |
| Logo System | ⬜ No iniciado | Selección de dirección visual | `docs/design/brand/VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md` |
| Color System | ⬜ No iniciado | Selección de dirección visual (o en paralelo al Logo System) | Ídem; `DECISION_QUEUE.md` DQ-002 |
| Typography System | ⬜ No iniciado | Logo System | Ídem |
| Iconography | ⬜ No iniciado | Logo System, Color System | Ídem |

**B. Google Play**

| Entregable | Estado | Dependencia | Fuente |
|---|---|---|---|
| Bloqueante B-1 — Data Safety | 🔴 Pendiente (última evidencia 2026-07-31) | Ninguna — acción exclusiva del CEO | `docs/archive/releases/PRODUCTION_READINESS_V2.md`; `DECISION_QUEUE.md` DQ-008 |
| Icono de la app | ⬜ No iniciado | Logo System (Workstream A) | `docs/design/brand/VISUAL_IDENTITY.md` |
| Feature Graphic | ⬜ No iniciado | Logo/Color System (Workstream A) | Ídem |
| Screenshots | ⬜ No iniciado | Identidad visual definida | `docs/archive/releases/PLAY_CONSOLE_CHECKLIST.md` |
| Video promocional | ⬜ Sin antecedente documental — DQ-006 | Identidad visual definida | `docs/program/DECISION_QUEUE.md` DQ-006 |
| Store Listing | ⬜ No iniciado | Identidad visual definida | `docs/archive/releases/PLAY_CONSOLE_CHECKLIST.md` |
| ASO básico | ⬜ No iniciado | Store Listing | Ídem |
| Corrección de `eas.json` (track de submit) | 🔴 Riesgo abierto | Ninguna | `docs/archive/releases/PRODUCTION_READINESS_V2.md` §3; `DECISION_QUEUE.md` DQ-009 |

**C. Producto**

| Entregable | Estado | Dependencia | Fuente |
|---|---|---|---|
| Revisión final de calidad | ⬜ No iniciado | Ninguna | `docs/archive/releases/PRODUCTION_READINESS_V2.md` |
| Checklist de Producción | 🟡 Parcial (3/4 bloqueantes históricos resueltos) | Cierre de Data Safety (Workstream B) | `docs/archive/releases/PLAY_CONSOLE_CHECKLIST.md` |
| Analytics — estrategia más allá del evento único actual | ⬜ No iniciado | Ninguna | `DECISION_QUEUE.md` DQ-005 |
| Validaciones finales (migración CFM-ID en producción, `API_SECRET_KEY` en Vercel) | ⬜ No verificado | Ninguna — verificación directa por el CTO | `DECISION_QUEUE.md` DQ-011, DQ-012 |

**D. Plataforma Web**

| Entregable | Estado | Dependencia | Fuente |
|---|---|---|---|
| Landing — aclarar si es un activo separado del sitio ya operativo | ⬜ Pendiente de definición | Ninguna | `DECISION_QUEUE.md` DQ-004 |
| Sitio público (`app-compara-farma-web.vercel.app`) | ✅ Ya operativo | Ninguna | `docs/archive/assessments/PROJECT_INVENTORY.md` §2 |
| Integración de la identidad visual resultante en el sitio | ⬜ No iniciado | Identidad Visual (Workstream A) | — |

**Riesgos de este sprint:** ver `docs/program/RISKS.md` — en particular R-001/B-1 (Data Safety, crítico), R-002 (`eas.json`), R-014 (ninguna decisión de marca/diseño ratificada por el CEO, riesgo transversal para todo el Workstream A). No se identifican riesgos nuevos propios de este sprint más allá de los ya registrados.

**Criterios de término:**

- Workstream A: Logo System, Color System, Typography System e Iconography decididos (con o sin ratificación formal del CEO, según DQ-007 se resuelva).
- Workstream B: assets de Google Play completos y Data Safety confirmado como cerrado.
- Workstream C: Checklist de Producción en verde y validaciones finales confirmadas.
- Workstream D: sitio web integrado visualmente con el resultado del Workstream A.
- ✅ La app dejó Prueba Cerrada (2026-08-08) (confirmación del CTO en sesión de chat, 2026-08-08 — ver `CLAUDE.md`, sección "Actualización de estado (2026-08-08)"; sin artefacto de Play Console verificado de forma independiente en este repositorio). Publicación efectiva en Producción a confirmar por Mario en Play Console (Acción 8 de `GO_LIVE_EXECUTION_PLAN.md`).

---

## 5. Relaciones

Este documento extrae su contenido de `docs/program/MASTER_BACKLOG.md` (de dónde viene el trabajo activo) y alimenta a `docs/program/DONE.md` (a dónde va cuando se cierra). El cierre del sprint anterior registrado en §4.1 se relaciona directamente con `docs/program/PHASE_TRANSITION.md`, que documenta el cierre de Fase 1 a nivel de programa completo (no solo de este sprint).

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Cierre del último sprint de ingeniería (Subscription Platform Fase 2 corregida) | `docs/product/decisions/DECISION_LOG.md` (entrada 2026-08-03) | Referencia | Contexto de por qué no hay sprint de ingeniería activo |
| Cierre del Sprint de Gobierno — Inicialización de `docs/program/` | Instrucción directa del CEO en esta sesión | ✔ (§4.1) | Estado: Completed |
| Apertura del sprint "Production Release 1.0" | Instrucción directa del CEO en esta sesión | ✔ (§4.2) | Workstreams A-D reconstruidos desde `MASTER_BACKLOG.md`, `RISKS.md`, `DECISION_QUEUE.md` |

---

## 7. Gobierno

Este documento se reemplaza por completo cuando cambia el sprint activo; su versión anterior no se conserva aquí — se resume en `docs/program/DONE.md` al cerrarse. Excepción de esta versión: el cierre del sprint de gobierno (§4.1) se documentó íntegramente aquí, por instrucción directa del CEO, antes de resumirse también en `DONE.md`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

`docs/program/MASTER_BACKLOG.md`, `PROGRAM_BOARD.md`, `DONE.md`, `PHASE_TRANSITION.md`, `RISKS.md`, `DECISION_QUEUE.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial, documentando el sprint de inicialización de `docs/program/` como trabajo activo actual. | `docs/program/MASTER_BACKLOG.md` |
| 1.1 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Cierre formal del sprint de inicialización de `docs/program/` (Estado: Completed) y apertura del nuevo sprint activo "Production Release 1.0" con 4 workstreams (A. Identidad Visual, B. Google Play, C. Producto, D. Plataforma Web). | `docs/program/PHASE_TRANSITION.md`, `MASTER_BACKLOG.md`, `RISKS.md`, `DECISION_QUEUE.md` |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Registro del sprint activo de inicialización del dominio de programa | Enterprise Program Manager | `docs/program/CURRENT_SPRINT.md` v1.0 (este documento) |
| 2026-08-05 | Cierre del sprint de gobierno y apertura de "Production Release 1.0" | Enterprise Program Manager / PMO Director | `docs/program/CURRENT_SPRINT.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna aprobación formal del CEO/fundador registrada todavía.
