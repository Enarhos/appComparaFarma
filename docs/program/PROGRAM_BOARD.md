# PROGRAM_BOARD — ComparaFarma

**Este es el documento con el que debe empezar toda sesión de trabajo.** Es una vista ejecutiva, no un registro detallado — cada afirmación aquí debe tener evidencia en `MASTER_BACKLOG.md`, `CURRENT_SPRINT.md`, `RISKS.md`, `DECISION_QUEUE.md`, `MILESTONES.md`, `DONE.md`, actas o commits/PRs del repositorio.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-BRD-001 |
| **Nombre** | PROGRAM_BOARD.md |
| **Dominio** | Gestión de Programa (`docs/program/`) |
| **Estado** | Activo |
| **Versión** | 1.3 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager / PMO Director / CTO |
| **Nivel de Gobierno** | De decisión operativa — se actualiza por sesión relevante |
| **Clasificación** | Documento de Gobierno de Programa |
| **Fuente Oficial** | Fuente oficial del estado consolidado del programa; no reemplaza fuentes de dominio |
| **Documentos de los que depende** | `docs/program/*`, actas vigentes relevantes, PRs/commits de `main`, documentación de dominios |
| **Última actualización** | 2026-08-23 |
| **Pregunta que responde** | ¿Dónde estamos, qué se terminó, qué estamos haciendo y qué viene después? |

---

## 2. Propósito

Dar en una sola lectura el estado real del programa completo, evitando que documentos históricos o atrasados se interpreten como trabajo vigente.

---

## 3. Alcance

**Este documento define:** estado ejecutivo, sprint activo, principales cierres, bloqueos, prioridades y próximos hitos.

**Este documento NO define:** detalle de iniciativas, especificaciones funcionales, decisiones técnicas ni historial granular.

---

## 4. Contenido principal

### 4.1 Estado General

La **Fase 1 — Arquitectura y Fundamentos** permanece cerrada desde 2026-08-05.

La **Fase 2 — Ejecución y Lanzamiento** sigue activa, pero el estado real avanzó materialmente respecto de la última versión de este tablero. Entre el 19 y 22 de agosto se cerraron en Producción:

- Product Identity Fase 1 (`presentationKey`) y hardening de identidad comercial;
- agrupamiento UX Web de productos comerciales;
- corrección del redirect loop OPKO;
- backend de eliminación de cuenta (`AUTH-DELETE-01`);
- UX Web/Mobile de eliminación de cuenta (`AUTH-DELETE-02`);
- actualización de política de privacidad asociada a cuentas y eliminación.

`main` quedó en `c9b422f` tras el merge de PR #109. Web y API fueron validados en Producción sobre ese commit.

El sprint vigente sigue siendo **`Production Release 1.0`**, pero ya no como construcción general: está en **cierre operacional**. La principal incertidumbre restante es el estado final efectivo de Mobile/Google Play, que debe verificarse directamente y no deducirse de documentación histórica contradictoria.

### 4.2 Programa

**PreciosFarma / ComparaFarma — Plataforma de Inteligencia Farmacéutica.**

El repositorio conserva referencias históricas a ComparaFarma y el producto público ya utiliza PreciosFarma en la Web. La normalización total de nomenclatura documental no se abre como tarea automática en este cierre.

### 4.3 Sprint Actual

**Production Release 1.0 — cierre operacional.**

Objetivo inmediato: confirmar cierre Mobile/Google Play, ejecutar QA visual final y dejar el gobierno documental suficientemente alineado para abrir el siguiente sprint sin arrastrar trabajo fantasma.

Detalle: `docs/program/CURRENT_SPRINT.md` v1.2.

### 4.4 Áreas del Programa — estado al 2026-08-23

| Área / Workstream | Estado | Detalle ejecutivo |
|---|---|---|
| **Enterprise** | 🟡 Fundamentos completos, continuación futura | No bloquea el release actual. Ratificación formal y cadena Enterprise posterior siguen pendientes. |
| **Brand / Design** | 🟡 Base definida, aplicación parcial | Web pública ya usa PreciosFarma; cualquier nueva evolución visual debe seguir gobierno de diseño. No se abre una nueva ronda de branding en este cierre. |
| **Launch / Google Play** | 🟡 Requiere verificación final | Existen referencias documentales contradictorias sobre salida de Prueba Cerrada vs pasos posteriores de AAB/cierre Mobile. Requiere confirmación directa en Play Console. |
| **Product / Engineering** | 🟢 Estable en Producción | Product Identity, agrupamiento Web, slugs, cuentas y eliminación están cerrados. No hay P0 conocido abierto por esas entregas. |
| **Platform Web/API** | 🟢 Operativo | Producción validada en `c9b422f`; `/api/health` verde y política de privacidad actualizada. |
| **Mobile** | 🟡 Funcional, cierre de release por verificar | Eliminación de cuenta implementada; tests Mobile básicos incorporados. Estado final de publicación/AAB requiere confirmación. |
| **Commercial** | 🟡 Motor disponible, catálogo real pendiente | No bloquea el cierre técnico inmediato; catálogo Premium real sigue siendo decisión posterior. |
| **Growth** | ⚪ Backlog | No iniciar nuevas épicas antes de cerrar release salvo regresión material. |
| **Program Governance** | 🟡 Reconciliado parcialmente | Board, Sprint, Done y acta 22/08 actualizados; backlog/riesgos/decisiones aún pueden contener estados históricos y deben tratarse como siguiente reconciliación selectiva, no como bloqueo del producto. |

### 4.5 Bloqueos / incertidumbres vigentes

| # | Tema | Severidad | Tratamiento |
|---|---|---|---|
| B-1 | Estado final Mobile / Google Play no documentado de forma inequívoca | Alta | Verificar directamente en Play Console y registrar evidencia actual. |
| B-2 | Checkout principal local atrasado y dirty | Media operativa | No usar para integraciones hasta aislar/resolver cambios; usar ramas/worktrees limpios. |
| B-3 | Documentos de backlog/riesgos/decisiones pueden contener estados anteriores al 22/08 | Media de gobierno | No ejecutar ítems solo porque aparezcan “abiertos”; contrastar con código, actas y `main`. |

No hay un blocker técnico conocido de `AUTH-DELETE-01/02` ni de Product Identity al cierre de esta reconciliación.

### 4.6 Prioridades vigentes

1. **Confirmar el estado real de Mobile en Google Play y del AAB vigente.** Este es el único punto que impide declarar cerrado `Production Release 1.0` con confianza documental.
2. **QA visual final de Web/Mobile.** Convertir cualquier defecto visible material en issue concreto, priorizado P0/P1/P2; no abrir una “fase de rediseño” genérica.
3. **Cerrar formalmente `Production Release 1.0`** cuando los dos puntos anteriores estén verdes y registrar el cierre en `DONE.md`/`MILESTONES.md`.
4. **Elegir el próximo frente de producto** después del cierre, usando evidencia real y no el backlog histórico sin reconciliar.
5. **Housekeeping técnico del checkout principal** en una sesión separada, sin mezclarlo con funcionalidad.

### 4.7 Próximos Hitos

- Confirmación operacional de Google Play / AAB.
- QA visual final sin P0/P1.
- Cierre formal de `Production Release 1.0`.
- Apertura del siguiente sprint con alcance explícitamente autorizado.

### 4.8 Indicadores de referencia

| Indicador | Estado |
|---|---|
| API tests | 312/312 en cierre AUTH-DELETE-02 |
| Domain tests | 120/120 |
| Web tests | 232/232 |
| Mobile tests | 16/16 |
| Web/API Producción | ✅ Validadas en `c9b422f` |
| Eliminación de cuenta E2E | ✅ Validada con cuenta QA descartable |
| Política de privacidad | ✅ Actualizada y validada en Producción |
| Google Play final | ⚠️ Verificación pendiente |

---

## 5. Relaciones

`CURRENT_SPRINT.md` contiene el trabajo activo detallado. `DONE.md` contiene la memoria de cierres. `MASTER_BACKLOG.md`, `RISKS.md` y `DECISION_QUEUE.md` siguen siendo fuentes de inventario, pero cualquier estado anterior al 22/08 debe contrastarse con esta reconciliación y con evidencia de `main`.

---

## 6. Matriz de Trazabilidad

| Hecho | Evidencia |
|---|---|
| Product Identity / UX Web / OPKO cerrados | `docs/archive/meetings/20260819.md`; commits `e75ca5b`, `73a0240`, `16064e8`, `59ef7d4` |
| AUTH-DELETE-01 Producción | PR #108; merge `7c29ea4` |
| AUTH-DELETE-02 + privacidad Producción | PR #109; merge `c9b422f`; `docs/archive/meetings/20260822.md` |
| Tests de cierre | informe final AUTH-DELETE-02 registrado en acta 20260822 |
| Estado Google Play | Requiere nueva evidencia directa; no se resuelve por inferencia documental |

---

## 7. Gobierno

Esta versión reemplaza la vista ejecutiva desactualizada del 7 de agosto. No reescribe decisiones históricas ni modifica documentos de dominio.

**Aprobación formal del CEO/fundador:** pendiente.

---

## 8. Documentos relacionados

`docs/program/CURRENT_SPRINT.md`, `MASTER_BACKLOG.md`, `RISKS.md`, `DECISION_QUEUE.md`, `DONE.md`, `MILESTONES.md`, `docs/archive/meetings/20260819.md`, `docs/archive/meetings/20260822.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios |
|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente | Creación inicial del tablero. |
| 1.1 | 2026-08-05 | Activo | Pendiente | Cierre Fase 1 / apertura Fase 2. |
| 1.2 | 2026-08-07 | Activo | Pendiente | Actualización parcial de Identity Architecture. |
| 1.3 | 2026-08-23 | Activo | Pendiente | Reconciliación completa del estado ejecutivo con cierres 19–22/08 y `main` `c9b422f`; sprint redefinido como cierre operacional. |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación del tablero | Enterprise Program Manager | v1.0 |
| 2026-08-05 | Transición a Fase 2 | Enterprise Program Manager / PMO Director | v1.1 |
| 2026-08-07 | Actualización parcial | CTO / Program | v1.2 |
| 2026-08-23 | Reconciliación post Product Identity + Account Deletion | CTO / Enterprise Program Manager | v1.3 |
