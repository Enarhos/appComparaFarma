# Revisión de Servicio — Sentry

**Código:** OPS-REV-009

**Nombre:** PLATFORM_SERVICE_REVIEW_SENTRY.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo que `OPS-SVC-001`, `OPS-BKL-001`, `OPS-REV-001` a `OPS-REV-008`.

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Revisión de Servicio Externo (ítem de backlog `OPS-SVC-BKL-012`)

**Documentos de los que depende:** `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` (ficha #5), `api/src/lib/sentry.ts`, `mobile/src/app/_layout.tsx`.

---

## 1. Uso actual

Sentry cubre reporte de excepciones no controladas en dos superficies separadas:

- **Backend (`api/`):** `api/src/lib/sentry.ts` inicializa `@sentry/node` solo si `SENTRY_DSN` está presente (no-op explícito si no lo está — línea `if (!dsn) return;`). `captureException()` se usa hoy en 3 rutas reales: `api/src/routes/search.ts`, `api/src/routes/priceHistory.ts` y `api/src/routes/donate.ts`.
- **Mobile:** `mobile/src/app/_layout.tsx` inicializa `@sentry/react-native` con `Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, enabled: !__DEV__, tracesSampleRate: 0.2 })` — activo solo en builds de producción, nunca en desarrollo.

`CLAUDE.md` confirma el proyecto `comparafarma-api` en sentry.io, región US.

## 2. Inventario

| Dato | Backend | Mobile |
|---|---|---|
| SDK | `@sentry/node` | `@sentry/react-native` |
| Variable de activación | `SENTRY_DSN` | `EXPO_PUBLIC_SENTRY_DSN` |
| Comportamiento sin DSN | No-op explícito, no lanza error | No verificable directamente, pero mismo patrón esperado |
| `tracesSampleRate` | 0.2 | 0.2 |
| Activo en desarrollo | Sí (no condicional a entorno en el código revisado) | No (`enabled: !__DEV__`) |

## 3. Plan contratado

**No verificable directamente en el Dashboard** en esta sesión. El patrón del código (condicional a DSN, sin configuración de límites/alertas de cuota) es consistente con el plan gratuito **Developer**, confirmado como hipótesis razonable pero no verificado contra la cuenta real.

## 4. Límites del plan

Investigado hoy directamente en `sentry.io/pricing` (reemplaza la cifra de terceros que citaba la Auditoría original, que resultó ser correcta):

| Recurso | Developer (Free) | Team ($26/mes) |
|---|---|---|
| Usuarios | **1** | Ilimitados |
| Proyectos | Ilimitados | Ilimitados |
| Errores/mes | **5.000** | 50.000 incluidos, luego pay-as-you-go |
| Logs | 5 GB | 5 GB + $0.50/GB adicional |
| Spans (tracing) | 5M | 5M |
| Session Replay | 50 | 50 |
| Uptime monitors | 1 | 1 |
| Cron monitors | 1 | 1 |
| Retención de datos | 30 días | Hasta 90 días |

La cifra de 5.000 errores/mes que la Auditoría original reportó como "cifra de terceros, no verificada" queda **confirmada oficial y exactamente correcta**. Hallazgo adicional no mencionado en la Auditoría original: el plan Developer/Free está limitado a **un solo usuario** — relevante si en el futuro más de una persona necesita acceso al dashboard de Sentry (hoy consistente con la operación de una sola persona, ver Audit ficha #10 general).

## 5. Riesgos

1. **🟢 Bajo — heredado, reconfirmado sin cambios.** Es no-op explícito si las variables de DSN no están configuradas — nunca bloquea funcionalidad, solo se pierde visibilidad de errores.
2. **🟡 Medio — heredado, reconfirmado.** A volumen alto de errores recurrentes (ej. un scraper de farmacia rompiéndose repetidamente en un loop), el límite de 5.000 eventos/mes puede agotarse y activar "Spike Protection" (descarte silencioso de eventos excedentes), ocultando señal real sin que nadie lo note. No verificable el volumen real de eventos actual sin acceso al Dashboard.
3. **🟢 Bajo — límite de 1 usuario en el plan Free (hallazgo nuevo, bajo impacto hoy).** Sin relevancia mientras la operación siga concentrada en una sola persona (patrón transversal ya documentado).

## 6. Consumo actual

**No verificable** sin acceso al Dashboard de Sentry en esta sesión. Recomendado como acción de seguimiento (no ejecutada aquí): revisar periódicamente si Spike Protection se ha activado alguna vez, lo cual indicaría que se está perdiendo señal de errores reales.

## 7. Escalabilidad

- **100–1.000 usuarios:** volumen de errores probablemente bajo, dentro del límite de 5.000/mes de Developer.
- **5.000+ usuarios:** si el volumen de tráfico expone más errores recurrentes de scraping (Ahumada/Sermecoop, ya documentados como frágiles), el límite de 5.000/mes podría alcanzarse — a diferencia de otros servicios de este inventario, no es un riesgo crítico porque Sentry es puramente de observabilidad, no bloquea ninguna funcionalidad si se agota la cuota.

## 8. Alternativas

- **Mantener el plan Developer/Free** mientras el volumen de errores sea bajo — es la recomendación por defecto dado el perfil de riesgo bajo.
- **Upgrade a Team ($26/mes)** si se necesita más de un usuario con acceso al dashboard, o si se confirma que Spike Protection se está activando y ocultando señal real.

## 9. Costos

$0/mes hoy (plan Developer/Free, hipótesis razonable no verificada contra la cuenta real).

## 10. Recomendación del CTO

🟢 **Mantener sin cambios.** Es el patrón de menor riesgo de todo el inventario: no bloquea funcionalidad si falla o se agota la cuota, la cifra de límite quedó confirmada oficialmente (5.000 errores/mes), y no hay evidencia de que se esté alcanzando ese límite. Única acción de bajo esfuerzo recomendada (no ejecutada): revisar el Dashboard de Sentry una vez para confirmar que Spike Protection nunca se ha activado, y así tener una línea base real de consumo — no crítico, puede hacerse cuando convenga.

Escala de decisión usada: 🟢 Mantener sin cambios · 🟡 Mantener con acción de configuración/código pendiente · 🟠 Evaluar upgrade/migración en el corto plazo · 🔴 Cambiar con urgencia.

---

## Relaciones

Esta revisión no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fuente original de la ficha #5, sigue vigente) ni a `PLATFORM_SERVICE_CATALOG.md`. Es la novena revisión individual generada a partir de `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001).

## Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Límites del plan Developer/Team | `sentry.io/pricing`, verificado 2026-08-15 | ✔ (§4) | Confirma exactamente la cifra que la Auditoría original citó como "no verificada" |
| Uso real en código (rutas con `captureException`, init de Mobile) | `api/src/lib/sentry.ts`, `api/src/routes/{search,priceHistory,donate}.ts`, `mobile/src/app/_layout.tsx` | ✔ (§1, §2) | Inventario propio de esta revisión |
| Comportamiento no-op sin DSN | Código real de `sentry.ts` | Heredado, reconfirmado | Sin cambios |

## Gobierno

Este documento no reemplaza `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `PLATFORM_SERVICE_REVIEW_BACKLOG.md` ni `RUNBOOK.md`. Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que las revisiones anteriores.

## Documentos relacionados

`docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`.

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-15 | Activo | Pendiente (CTO) | Creación de la novena revisión individual de servicio del backlog `OPS-BKL-001` — Sentry (backend + mobile). Sin hallazgos críticos nuevos; confirmación oficial de los límites del plan Free. Ningún código modificado. | `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `sentry.io/pricing` (oficial) |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-15 | Revisión completa de Sentry — noveno ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_SENTRY.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado.
