# Revisión de Servicio — PostHog

**Código:** OPS-REV-010

**Nombre:** PLATFORM_SERVICE_REVIEW_POSTHOG.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo que `OPS-SVC-001`, `OPS-BKL-001`, `OPS-REV-001` a `OPS-REV-009`.

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Revisión de Servicio Externo (ítem de backlog `OPS-SVC-BKL-013`)

**Documentos de los que depende:** `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` (ficha #12), `mobile/src/lib/analytics.ts`.

---

## 1. Uso actual

PostHog cubre analítica de producto exclusivamente en `mobile/` — no se usa en `api/` ni en `web/`. `mobile/src/lib/analytics.ts` captura un único evento hoy, `medication_search`, con query original, query normalizada, cantidad de resultados, farmacias con resultados, mejor precio, mejor farmacia y comuna seleccionada.

## 2. Inventario

| Dato | Valor | Evidencia |
|---|---|---|
| SDK | `posthog-react-native` | `mobile/package.json` |
| Proyecto/región | PostHog Cloud US (`host: "https://us.i.posthog.com"`) | `mobile/src/lib/analytics.ts` |
| Tipo de key | `phc_...` — write-only, segura para commitear (comentario explícito en el propio código) | `mobile/src/lib/analytics.ts` línea 1 |
| Evento capturado | `medication_search` (único evento hoy) | `captureSearch()` en `analytics.ts` |

## 3. Plan contratado

**No verificable directamente en el Dashboard.** El uso de PostHog Cloud US sin mención de plan pagado es consistente con el tier Free.

## 4. Límites del plan

Investigado hoy directamente en `posthog.com/pricing` (confirma la cifra que la Auditoría original citó como "no verificada"):

| Recurso | Free (verificado 2026-08-15) |
|---|---|
| Eventos de Product Analytics | 1.000.000/mes |
| Proyectos | 1 |
| Retención de datos | 1 año |
| Miembros del equipo | Ilimitados (sin límite de seats, a diferencia de Sentry) |
| Session Replay | 5.000 grabaciones/mes (no usado por ComparaFarma hoy) |
| Error Tracking | 100.000 excepciones/mes (no usado — ComparaFarma usa Sentry para esto) |

La cifra de 1.000.000 eventos/mes que la Auditoría original marcó como "cifra de terceros, no verificada" queda **confirmada oficial y exactamente correcta**. A diferencia de Sentry, el plan Free de PostHog no limita el número de usuarios con acceso al dashboard.

## 5. Riesgos

1. **🟢 Bajo — heredado, reconfirmado sin cambios.** Analítica, no crítica para funcionalidad — sin manejo de fallo explícito visible en el código, pero el SDK de PostHog está diseñado para no bloquear el hilo principal si la red falla (comportamiento estándar del SDK, no auditado línea por línea).
2. **🟢 Bajo — techo muy alto para el volumen actual.** Con 1 evento por búsqueda, se necesitarían ~33.000 búsquedas/día sostenidas todo el mes para agotar el 1M de eventos — muy por encima del volumen real esperado a corto/mediano plazo (Expo/EAS reportó 1 MAU real en la revisión de esa cuenta).
3. **🟡 Bajo-medio — hallazgo menor, no investigado en profundidad.** Durante la validación del fix de recuperación de contraseña en esta misma sesión, se observó un toast de error relacionado con PostHog en Mobile (mensaje genérico, sin detalle capturado). Se consideró en ese momento no bloqueante para el flujo que se estaba validando, pero no se investigó su causa — queda como un cabo suelto menor para revisar cuando convenga, no urgente dado que PostHog es puramente analítico.

## 6. Consumo actual

**No verificable** sin acceso al Dashboard de PostHog. Dado el volumen real de usuarios reportado en otras revisiones de esta sesión (Expo/EAS: 1 MAU), el consumo real hoy es casi con certeza una fracción mínima del límite de 1M eventos/mes.

## 7. Escalabilidad

Es, junto con GitHub Actions (en repo público), el servicio con más margen de todo el inventario: 1M eventos/mes cubre cómodamente hasta varios miles de usuarios activos diarios buscando varias veces al día. No se proyecta como cuello de botella en ningún escenario de crecimiento realista para ComparaFarma a mediano plazo.

## 8. Alternativas

- **Mantener el plan Free** — sin ninguna razón para cambiarlo dado el margen disponible.
- **Investigar el error de PostHog observado en Mobile** (§5.3) cuando haya tiempo — no urgente, pero vale la pena entender qué lo dispara antes de que el volumen de usuarios crezca.

## 9. Costos

$0/mes.

## 10. Recomendación del CTO

🟢 **Mantener sin cambios.** Es, junto con Sentry, uno de los servicios de menor riesgo del inventario — no bloquea funcionalidad, el límite de plan quedó confirmado oficialmente con margen amplio, y no depende de una cuenta de un tercero como Algolia o MINSAL. Única acción de bajo esfuerzo sugerida (no urgente, no ejecutada): revisar qué disparó el toast de error de PostHog visto durante la validación de Mobile en esta sesión.

Escala de decisión usada: 🟢 Mantener sin cambios · 🟡 Mantener con acción de configuración/código pendiente · 🟠 Evaluar upgrade/migración en el corto plazo · 🔴 Cambiar con urgencia.

---

## Relaciones

Esta revisión no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fuente original de la ficha #12, sigue vigente) ni a `PLATFORM_SERVICE_CATALOG.md`. Es la décima revisión individual generada a partir de `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001).

## Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Límites del plan Free | `posthog.com/pricing`, verificado 2026-08-15 | ✔ (§4) | Confirma exactamente la cifra que la Auditoría original citó como "no verificada" |
| Uso real en código (evento único, campos capturados) | `mobile/src/lib/analytics.ts` | ✔ (§1, §2) | Inventario propio de esta revisión |
| Error de PostHog observado en Mobile durante otra validación | Observación directa del CTO en esta sesión (sin detalle capturado) | ✔ (§5.3) | No investigado en profundidad, cabo suelto menor |

## Gobierno

Este documento no reemplaza `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `PLATFORM_SERVICE_REVIEW_BACKLOG.md` ni `RUNBOOK.md`. Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que las revisiones anteriores.

## Documentos relacionados

`docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`.

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-15 | Activo | Pendiente (CTO) | Creación de la décima revisión individual de servicio del backlog `OPS-BKL-001` — PostHog. Sin hallazgos críticos nuevos; confirmación oficial de los límites del plan Free. Ningún código modificado. | `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `posthog.com/pricing` (oficial) |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-15 | Revisión completa de PostHog — décimo ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_POSTHOG.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado.
