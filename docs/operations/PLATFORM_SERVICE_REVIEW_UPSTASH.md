# Revisión de Servicio — Upstash Redis

**Código:** OPS-REV-012

**Nombre:** PLATFORM_SERVICE_REVIEW_UPSTASH.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo que `OPS-SVC-001`, `OPS-BKL-001`, `OPS-REV-001` a `OPS-REV-011`.

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Revisión de Servicio Externo (ítem de backlog `OPS-SVC-BKL-009`)

**Documentos de los que depende:** `docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` (ficha #4), `api/src/lib/cache.ts`, `api/src/middleware/rateLimit.ts`.

---

## 1. Uso actual

Upstash Redis cubre dos funciones en `api/`, ambas con **fallback automático a memoria** si las variables de entorno no están presentes o si la llamada a Redis falla:

- **Caché de resultados de búsqueda** (`api/src/lib/cache.ts`): `getCachedSearch()`/`setCachedSearch()`, TTL configurable (`SEARCH_CACHE_TTL_MS`, default 5 min), prefijo de key `cfsearch:`.
- **Rate limiting distribuido** (`api/src/middleware/rateLimit.ts`): `consumeRateLimit()`, ventana configurable (`RATE_LIMIT_WINDOW_MS`, default 60s) y máximo configurable (`RATE_LIMIT_MAX`, default 60), vía `INCR`+`EXPIRE` sobre una key por IP/ventana, prefijo `ratelimit:`.
- **Healthcheck** (`pingRedis()` en `cache.ts`): ping real contra Redis para `/api/health`, con timeout de 1.500ms; devuelve `"ok"` / `"degraded"` / `"not_configured"` sin exponer secretos.

Ambos módulos inicializan el cliente en un `try/catch` y degradan a un `Map` en memoria si `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` no están configuradas o si la operación falla — el sistema nunca cae por un fallo de Redis, solo pierde precisión (caché por instancia en vez de compartido; rate limit por instancia en vez de global).

## 2. Inventario

| Dato | Valor | Evidencia |
|---|---|---|
| SDK | `@upstash/redis` | `api/package.json` |
| Variables | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (Vercel) | `cache.ts`, `rateLimit.ts` |
| Usos | Caché de búsqueda, rate limiting, healthcheck | `api/src/lib/cache.ts`, `api/src/middleware/rateLimit.ts` |
| Comportamiento sin config/con fallo | Fallback explícito a `Map` en memoria, sin excepción no controlada | Ambos módulos, `try/catch` verificado línea por línea |

## 3. Plan contratado

**No verificable directamente en el dashboard** en esta sesión. El patrón (sin configuración de budget ni alertas de cuota visibles en el código) es consistente con el tier **Free**, tal como ya indicaba la Auditoría original — hipótesis razonable, no confirmada contra la cuenta real.

## 4. Límites del plan

Investigado hoy directamente en `upstash.com/pricing/redis` (confirma exactamente la cifra que la Auditoría original ya citaba como oficial, sin discrepancia):

| Recurso | Free (verificado 2026-08-15) |
|---|---|
| Datos | 256 MB |
| Bandwidth mensual | 10 GB |
| Comandos mensuales | 500.000 |
| Comandos/segundo (máx.) | 10.000 |
| Bases de datos | Hasta 10 gratis |
| Tamaño máx. de request | 10 MB |

Hallazgo adicional no mencionado en la Auditoría original: comandos operacionales (`AUTH`, `PING`, `INFO`, etc.) no se cobran/cuentan contra la cuota — el ping del healthcheck (`pingRedis()`) usa `GET`, que sí cuenta como comando facturable, aunque su volumen es marginal (una vez por invocación de `/api/health`).

## 5. Riesgos

1. **🟢 Bajo — heredado, reconfirmado sin cambios.** Fallback a memoria ya integrado y verificado en ambos módulos (`cache.ts`, `rateLimit.ts`) — nunca bloquea funcionalidad, solo degrada precisión (caché por instancia, rate limit por instancia).
2. **🟡 Medio — heredado, reconfirmado.** Cada búsqueda no cacheada consume al menos ~3 comandos (`get` de caché + `set` de caché + `incr` de rate limit). Con 500.000 comandos/mes de margen, esto sostiene aproximadamente 166.000 búsquedas no cacheadas al mes antes de agotar la cuota — cómodo para el volumen actual, pero es el segundo límite más ajustado del inventario después de Expo/EAS si el tráfico crece rápido.
3. **🟢 Bajo — nuevo, menor.** El healthcheck (`pingRedis()`) agrega un comando `get` adicional por cada llamada a `/api/health` — si el monitor horario (`Monitor API`, cada hora) y health checks externos se multiplican, esto suma al consumo mensual, aunque de forma marginal (un comando extra por chequeo, no por búsqueda de usuario).

## 6. Consumo actual

**No verificable** sin acceso al Dashboard de Upstash. Recomendado como acción de seguimiento (no ejecutada): revisar el consumo real de comandos/mes antes de que el tráfico crezca, para anticipar si el límite de 500K se acerca.

## 7. Escalabilidad

- **100–1.000 usuarios:** sin riesgo, muy por debajo del límite de 500K comandos/mes.
- **10.000+ usuarios con búsquedas frecuentes:** el límite de 500K comandos/mes podría alcanzarse (siguiendo el cálculo de ~3 comandos por búsqueda no cacheada del punto 5.2) — coincide con la proyección ya hecha en la Auditoría original.
- **100.000 usuarios:** upgrade a Pay as You Go ($0,20 por 100K comandos) o a un plan Fixed casi seguro necesario.

## 8. Alternativas

- **Mantener el plan Free** — sin ninguna razón para cambiarlo dado el margen disponible hoy.
- **Monitorear el consumo real en el dashboard de Upstash** antes de que el tráfico crezca, para anticipar el upgrade en vez de reaccionar a una degradación silenciosa a memoria (que no cae, pero sí pierde precisión de caché/rate limit compartido entre instancias).
- **Upgrade a Pay as You Go** ($0,20/100K comandos) si se supera el límite de 500K/mes — sin costo fijo, escala con el uso real.

## 9. Costos

$0/mes hoy (plan Free, hipótesis razonable no verificada contra la cuenta real). Si se supera el límite: $0,20 por cada 100.000 comandos adicionales (Pay as You Go, confirmado oficialmente hoy).

## 10. Recomendación del CTO

🟢 **Mantener sin cambios.** Es, junto con Sentry y PostHog, uno de los servicios de menor riesgo del inventario: el diseño con fallback a memoria ya es robusto y fue verificado línea por línea en ambos módulos, los límites del plan Free quedaron confirmados oficialmente sin discrepancia con la Auditoría original, y no depende de una cuenta de terceros. Única acción de bajo esfuerzo sugerida (no urgente, no ejecutada): revisar el consumo real de comandos en el dashboard de Upstash antes de que el tráfico crezca de forma significativa.

Escala de decisión usada: 🟢 Mantener sin cambios · 🟡 Mantener con acción de configuración/código pendiente · 🟠 Evaluar upgrade/migración en el corto plazo · 🔴 Cambiar con urgencia.

---

## Relaciones

Esta revisión no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fuente original de la ficha #4, sigue vigente) ni a `PLATFORM_SERVICE_CATALOG.md`. Es la duodécima revisión individual generada a partir de `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001).

## Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Límites del plan Free | `upstash.com/pricing/redis`, verificado 2026-08-15 | ✔ (§4) | Confirma exactamente las cifras que la Auditoría original ya citaba como oficiales — sin discrepancia |
| Uso real en código (caché, rate limit, healthcheck) | `api/src/lib/cache.ts`, `api/src/middleware/rateLimit.ts` | ✔ (§1, §2) | Inventario propio de esta revisión, incluyendo el comando extra de `pingRedis()` no mencionado antes |
| Comportamiento de fallback a memoria | Código real, `try/catch` verificado línea por línea | ✔ (§1, §5.1) | Heredado, reconfirmado sin cambios |

## Gobierno

Este documento no reemplaza `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `PLATFORM_SERVICE_REVIEW_BACKLOG.md` ni `RUNBOOK.md`. Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que las revisiones anteriores.

## Documentos relacionados

`docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`.

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-15 | Activo | Pendiente (CTO) | Creación de la duodécima revisión individual de servicio del backlog `OPS-BKL-001` — Upstash Redis. Sin hallazgos críticos nuevos; confirmación oficial de los límites del plan Free. Ningún código modificado. | `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `upstash.com/pricing/redis` (oficial) |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-15 | Revisión completa de Upstash Redis — duodécimo ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/PLATFORM_SERVICE_REVIEW_UPSTASH.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado.
