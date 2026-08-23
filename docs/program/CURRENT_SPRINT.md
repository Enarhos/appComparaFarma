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
| **Versión** | 1.2 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager / CTO |
| **Nivel de Gobierno** | De decisión operativa — se reemplaza cuando cambia el sprint activo; su cierre se registra en `DONE.md` |
| **Clasificación** | Documento de Ejecución de Programa |
| **Fuente Oficial** | Este documento, para el sprint activo actual |
| **Documentos de los que depende** | `docs/program/MASTER_BACKLOG.md`, `docs/program/PROGRAM_BOARD.md`, `docs/archive/meetings/20260819.md`, `docs/archive/meetings/20260822.md`, commits y PRs en `main` |
| **Última actualización** | 2026-08-23 |
| **Pregunta que responde** | ¿Qué se está haciendo exactamente ahora mismo? |

---

## 2. Propósito

Declarar sin ambigüedad el trabajo activo del programa. Esta versión reconcilia el documento con el estado real de Producción después de Product Identity, cierre de Web y eliminación autoservicio de cuenta.

---

## 3. Alcance

**Este documento define:** el sprint activo, su objetivo, entregables aún abiertos, evidencia de lo ya cerrado dentro del sprint y criterios de término.

**Este documento NO define:** el backlog completo (→ `MASTER_BACKLOG.md`), el historial (→ `DONE.md`) ni decisiones estratégicas de dominio.

---

## 4. Contenido principal

### 4.1 Sprint activo: Production Release 1.0 — cierre operacional

**Estado:** 🟡 Activo, en fase de cierre.

**Decisión de reconciliación (2026-08-23):** el sprint **no se cierra todavía** porque el repositorio contiene evidencia suficiente de que gran parte del producto ya está en Producción, pero no existe una confirmación documental inequívoca y reciente del estado final de Google Play / AAB / publicación efectiva de Mobile. Abrir un sprint nuevo ahora inventaría una transición no ratificada. Por tanto se mantiene `Production Release 1.0`, reduciendo su alcance a cierre operacional y calidad de lanzamiento.

**Objetivo actualizado:** cerrar el lanzamiento de PreciosFarma con Web/API estables en Producción, Mobile listo para el estado final de Google Play que corresponda, cumplimiento de cuenta/privacidad completo y una revisión visible de calidad antes de declarar terminado el release.

### 4.2 Cierres ya logrados dentro del sprint

| Entregable | Estado | Evidencia |
|---|---|---|
| Product Identity — `presentationKey` y separación de productos comerciales | ✅ Producción | `docs/archive/meetings/20260819.md`; commits `e75ca5b`, `73a0240` |
| UX Web agrupada por presentación / producto comercial | ✅ Producción | `docs/archive/meetings/20260819.md`; commit `16064e8` |
| Fix redirect loop OPKO / slugs Gen 3 | ✅ Producción | `docs/archive/meetings/20260819.md`; commit `59ef7d4` |
| Backend de eliminación de cuenta (`AUTH-DELETE-01`) | ✅ Producción | PR #108; merge `7c29ea4` |
| UX Web/Mobile de eliminación de cuenta (`AUTH-DELETE-02`) | ✅ Producción | PR #109; merge `c9b422f`; `docs/archive/meetings/20260822.md` |
| Política de privacidad actualizada para cuentas y eliminación | ✅ Producción | commit `6b5e6c3`; `/privacidad` validado en Producción |
| Infraestructura básica de tests Mobile | ✅ Incorporada | commit `1adc7ba`; 16/16 tests en cierre AUTH-DELETE-02 |
| Web/API en Producción con health check sobre el merge actual | ✅ | `c9b422f`; cierre AUTH-DELETE-02 |

### 4.3 Trabajo activo / pendiente para cerrar el sprint

| Frente | Estado | Acción de cierre |
|---|---|---|
| **Google Play / Mobile** | 🟡 Requiere verificación operacional | Confirmar el estado real actual en Play Console: Producción vs etapa previa; validar que el AAB vigente corresponde al código aprobado y que no queda un gate de publicación pendiente. La documentación histórica contiene referencias contradictorias y no debe adivinarse el estado. |
| **QA visual Web/Mobile** | 🟡 Pendiente de pasada final | Revisar calidad visible y paridad entre plataformas antes de cerrar el release; cualquier hallazgo se registra como issue concreto y no como una nueva épica genérica. |
| **Gobierno documental** | 🟡 En reconciliación | Incorporar cierres 19–22 de agosto en `PROGRAM_BOARD.md`, `DONE.md` y actas. Esta tarea no reabre trabajo ya validado. |
| **Checkout local principal** | ⚪ Fuera del release, housekeeping | Sigue reportado como atrasado y dirty; no usarlo para integración hasta resolver o aislar sus cambios. No es bloqueo de Producción. |

### 4.4 Fuera del alcance de cierre inmediato

No se inicia automáticamente ninguno de estos frentes por el solo hecho de estar en backlog:

- catálogo comercial Premium;
- nuevas fases de Product Identity;
- bioequivalencia avanzada;
- IA/escaneo de receta;
- nueva ronda de arquitectura empresarial;
- implementación adicional de Identity Architecture;
- nuevas integraciones de farmacias.

Requieren una decisión posterior del CEO/CTO una vez cerrado `Production Release 1.0`.

### 4.5 Riesgos activos relevantes

1. **Estado Mobile/Google Play no reconciliado documentalmente.** Hay referencias a salida de Prueba Cerrada y, en documentación posterior, a completar AAB/cierre Mobile. Se requiere una verificación directa, no inferencia.
2. **Documentación de programa atrasada respecto al código.** Este documento reduce la brecha, pero `MASTER_BACKLOG.md`, `RISKS.md` y `DECISION_QUEUE.md` aún pueden contener estados históricos que deben tratarse con cautela hasta su siguiente reconciliación.
3. **Checkout local principal atrasado/dirty.** Riesgo operativo para integraciones locales, no para el código ya desplegado.

### 4.6 Criterios de término del sprint

`Production Release 1.0` se considerará cerrado cuando se cumplan todos los siguientes puntos:

- estado final de Mobile/Google Play confirmado de forma explícita;
- AAB/versión de Mobile correspondiente al release validada si todavía aplica;
- Web/API continúan verdes en Producción;
- eliminación de cuenta y privacidad permanecen operativas (ya cumplido, sujeto solo a regresión);
- QA visual final sin defectos P0/P1 abiertos;
- documentación de programa refleja el estado real suficiente para abrir el siguiente sprint sin arrastrar pendientes fantasma.

---

## 5. Relaciones

Este documento consume `MASTER_BACKLOG.md` como inventario, pero prevalece para declarar el sprint activo. Los cierres se registran en `DONE.md`; el estado ejecutivo se resume en `PROGRAM_BOARD.md`.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Product Identity y UX Web | `docs/archive/meetings/20260819.md`, commits en `main` | ✔ | Cerrado en Producción |
| Eliminación de cuenta backend | PR #108 / merge `7c29ea4` | ✔ | Cerrado en Producción |
| Eliminación de cuenta Web/Mobile + privacidad | PR #109 / merge `c9b422f`, acta 20260822 | ✔ | Cerrado en Producción |
| Estado final Google Play | Play Console / confirmación explícita del CEO | ⚠️ Pendiente | No se infiere desde referencias históricas contradictorias |

---

## 7. Gobierno

La versión 1.2 no declara un sprint nuevo: mantiene `Production Release 1.0` hasta que exista evidencia suficiente para cerrarlo. Esta es una decisión conservadora de gobierno para evitar crear trabajo o transiciones ficticias.

**Aprobación formal del CEO/fundador:** pendiente.

---

## 8. Documentos relacionados

`docs/program/MASTER_BACKLOG.md`, `PROGRAM_BOARD.md`, `DONE.md`, `RISKS.md`, `DECISION_QUEUE.md`, `docs/archive/meetings/20260819.md`, `docs/archive/meetings/20260822.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente | Creación inicial del sprint de gobierno. | `MASTER_BACKLOG.md` |
| 1.1 | 2026-08-05 | Activo | Pendiente | Cierre del sprint de gobierno y apertura de `Production Release 1.0`. | `PHASE_TRANSITION.md` |
| 1.2 | 2026-08-23 | Activo | Pendiente | Reconciliación con estado real de Producción al 22/08: Product Identity, Web, AUTH-DELETE-01/02 y privacidad cerrados; `Production Release 1.0` se mantiene solo para cierre operacional Mobile/Google Play + QA final. | Actas 20260819/20260822; PR #108/#109; `main` `c9b422f` |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Registro del sprint de inicialización | Enterprise Program Manager | v1.0 |
| 2026-08-05 | Apertura de `Production Release 1.0` | Enterprise Program Manager / PMO Director | v1.1 |
| 2026-08-23 | Reconciliación post Product Identity + Account Deletion | CTO / Enterprise Program Manager | v1.2; sprint mantenido en cierre operacional |
