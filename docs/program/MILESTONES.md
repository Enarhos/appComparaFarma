# MILESTONES — ComparaFarma

Registro de los grandes hitos alcanzados por el programa. A diferencia de `DONE.md` (memoria detallada de cada entrega), este documento registra solo hitos de nivel programa — logros que marcan un cambio de fase, no cada tarea completada.

**Regla de gobierno:** nunca se elimina ni se edita retroactivamente una fila de este documento. Solo se agregan filas nuevas.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-MIL-001 |
| **Nombre** | MILESTONES.md |
| **Dominio** | Gestión de Programa (`docs/program/`) |
| **Estado** | Activo |
| **Versión** | 1.1 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager |
| **Nivel de Gobierno** | Histórico / inmutable en sus filas ya registradas — se le agrega, no se le edita |
| **Clasificación** | Registro de Hitos de Programa |
| **Fuente Oficial** | Este documento, para hitos de nivel programa. Cada hito individual tiene su propia fuente de detalle, citada en la tabla |
| **Documentos de los que depende** | `docs/audits/*`, `docs/enterprise/*`, `docs/brand/*`, `docs/design/*`, `docs/release/*`, `docs/product/DECISION_LOG.md` |
| **Pregunta que responde** | ¿Qué grandes hitos ha alcanzado el programa hasta ahora, y cuáles están todavía en curso? |

---

## 2. Propósito

Dar memoria de los hitos que marcaron un cambio de fase en el programa — para que, con el tiempo, se pueda reconstruir cómo llegó ComparaFarma a su estado actual sin depender de la memoria de quienes participaron.

---

## 3. Alcance

**Este documento define:** hitos de nivel programa, con fecha, evidencia y estado real (alcanzado o en seguimiento).

**Este documento NO define:** el detalle de cada entrega individual (→ `DONE.md`), ni marca como "alcanzado" ningún hito que la evidencia no respalde como completado.

---

## 4. Contenido principal

### 4.1 Hitos alcanzados

| Fecha | Hito | Evidencia | Nota |
|---|---|---|---|
| 2026-06-29 | Shared Domain Package — fin de la duplicación de `normalization.ts`/`types.ts` entre `api/` y `mobile/` | `docs/engineering/adr/ADR-0001_SHARED_DOMAIN_PACKAGE.md` | Creación de `packages/domain` |
| 2026-07-19 | Postmortem PM-001 resuelto — pipeline de deploy del backend reparado | `docs/engineering/postmortems/PM-001_DEPLOY_PIPELINE_BROKEN.md` | Deploy en producción estabilizado |
| 2026-07-20 | Fase 1 de `COMPANY_STRATEGY.md` — historial de precios en Supabase, tracking de clicks, lanzamiento de `web/` | `docs/product/DECISION_LOG.md` (entradas 2026-07-20) | Primer paso de "app a empresa" |
| 2026-07-31 | Ratificación de la secuencia de Sprints 0–F con scoring CFPS | `docs/actas/20260731b.md` | Orden E → A → C → spike → B |
| 2026-07-31 | Sprints E (receta completa), A (CFM-ID), C (alertas email) implementados y mergeados | `docs/product/DECISION_LOG.md` (entradas 2026-07-31) | — |
| 2026-08-02 | **Gobierno Documental** — primera auditoría formal del repositorio completo | `docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` | Diagnóstico base para toda la gobernanza posterior |
| 2026-08-02 | Sprint D (cuenta ligera + perfil) implementado | `docs/product/DECISION_LOG.md` | — |
| 2026-08-02/03 | Subscription Platform — Fase 1 (motor + Google Play adapter) y Fase 2 (Web Billing) implementadas y mergeadas | `docs/archive/product/EPICS_2026-08-15.md` | Fase 2 corregida de Stripe a Flow por incompatibilidad con Chile |
| 2026-08-03 | **Arquitectura Empresarial — primera versión escrita** (Business Capability Map, Business Services, Enterprise Data Model, Digital Asset Register) | `docs/actas/20260803.md`, `docs/enterprise/*` | Estado: Draft/En Elaboración — **sin ratificación formal del CEO todavía** |
| 2026-08-05 | **Arquitectura de Marca — completa (Draft)**: Brand Audit, Brand Foundations, Visual Identity, Design Concept, Brand Architecture | `docs/brand/*` | Estado: Draft — **sin ratificación formal del CEO todavía** |
| 2026-08-05 | **Arquitectura de Diseño (dominio de proceso) — creada**: README, Design Exploration (EXP-001 abierta), Design Decision Log (DD-001 aprobado como decisión de proceso) | `docs/design/*` | Sin dirección visual final seleccionada todavía |
| 2026-08-05 | **Arquitectura de Portafolio — resuelta**: modelo Branded House recomendado, marca principal identificada, portafolio reconstruido | `docs/brand/BRAND_ARCHITECTURE.md` | Cierra el vacío señalado en `docs/brand/BRAND_AUDIT.md` §5 |
| 2026-08-05 | **Gobierno Operativo del Programa — dominio creado**: `docs/program/` con sus 9 documentos | Este mismo dominio | Primer corte de estado consolidado del programa completo |
| 2026-08-05 | **Arquitectura Estratégica Consolidada — cierre formal de Fase 1**: construcción de fundamentos concluida en los cuatro dominios que la componen (Enterprise, Brand, Design, Program Governance) | `docs/program/PHASE_TRANSITION.md`; `docs/enterprise/*`, `docs/brand/*`, `docs/design/*`, `docs/program/*` | Hito de cambio de fase, no de ratificación: ningún documento de Enterprise o Brand tiene aprobación formal del CEO todavía (eso sigue en `DECISION_QUEUE.md`, DQ-007) — lo que se cierra es la construcción, no la validación final. Abre la Fase 2 (Ejecución y Lanzamiento), sprint activo "Production Release 1.0" |

### 4.2 Hitos en seguimiento (no alcanzados todavía)

Incluidos aquí porque el programa los sigue activamente, aunque la evidencia disponible confirma que **no** están completados a la fecha de esta versión — no se marcan como logrados para no falsear el registro.

| Hito previsto | Estado real | Evidencia |
|---|---|---|
| Prueba Cerrada de Google Play finalizada (paso a Producción) | 🟡 **Restricción de código levantada (2026-08-08)** (confirmación del CTO en sesión de chat, 2026-08-08 — ver `CLAUDE.md`, sección "Actualización de estado (2026-08-08)"; sin artefacto de Play Console verificado de forma independiente en este repositorio). La publicación efectiva del AAB vc31 en el track de Producción (Acción 8 de `GO_LIVE_EXECUTION_PLAN.md`) sigue sin evidencia verificable en este repositorio — no se marca "paso a Producción" alcanzado hasta que Mario lo confirme en Play Console. | `CLAUDE.md`, `docs/release/GO_LIVE_EXECUTION_PLAN.md` Acción 8 |
| Preparación de Producción completa | 🟡 **Parcial.** 3 de 4 bloqueantes históricos resueltos (API_SECRET_KEY, Algolia hardcodeada, Target SDK). Pendiente: Data Safety, y un riesgo abierto de configuración (`eas.json` track "internal"). | `docs/release/PRODUCTION_READINESS_V2.md` |

---

## 5. Relaciones

Este documento se alimenta de `docs/program/DONE.md` (que registra el detalle de cada entrega) — un hito de este documento normalmente agrupa varias entradas de `DONE.md`. Se relaciona con `docs/program/ROADMAP.md` como el registro de lo ya recorrido de cada workstream.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Estado real de Prueba Cerrada / Producción | `CLAUDE.md` | ✔ — actualizado a "finalizada" el 2026-08-08 (confirmación del CTO en sesión de chat, 2026-08-08 — ver `CLAUDE.md`, sección "Actualización de estado (2026-08-08)"; sin artefacto de Play Console verificado de forma independiente en este repositorio) | Se incluye por pedido expreso, marcado con su estado real |
| Hitos de Arquitectura (Empresarial, Marca, Diseño, Portafolio) | `docs/enterprise/*`, `docs/brand/*`, `docs/design/*` | ✔ (§4.1) | Todos marcados como Draft/sin ratificar, no como "cerrados" en sentido de aprobación final |

---

## 7. Gobierno

Este documento nunca se edita retroactivamente — las filas ya escritas permanecen, incluso si un hito posteriormente se revierte o se corrige en otro lugar (en ese caso, se agrega una fila nueva que lo señale, no se borra la anterior).

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

`docs/program/DONE.md`, `ROADMAP.md`, `PROGRAM_BOARD.md`, `PHASE_TRANSITION.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Reconstrucción inicial de hitos de programa desde el 2026-06-29 hasta la fecha, distinguiendo hitos alcanzados de hitos en seguimiento todavía no completados. | Ver Matriz de Trazabilidad (§6) |
| 1.1 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Se agrega el hito "Arquitectura Estratégica Consolidada", registrando el cierre formal de Fase 1 del programa (§4.1). No se editó ninguna fila previa. | `docs/program/PHASE_TRANSITION.md` |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Reconstrucción del registro de hitos de programa | Enterprise Program Manager | `docs/program/MILESTONES.md` v1.0 (este documento) |
| 2026-08-05 | Registro del hito de cierre de Fase 1 | Enterprise Program Manager / PMO Director | `docs/program/MILESTONES.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna aprobación formal del CEO/fundador registrada todavía.
