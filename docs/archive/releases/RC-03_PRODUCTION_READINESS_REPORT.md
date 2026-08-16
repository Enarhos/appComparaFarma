# RC-03 — Production Readiness Report: Observability & Operations

**Fecha:** 2026-08-06
**Alcance:** `mobile/`, `api/`, `web/`, `packages/domain/`, `docs/`, `.github/`
**Restricciones respetadas:** sin nuevas funcionalidades, sin cambios de UX, sin cambios de comportamiento funcional del producto, sin breaking changes, sin modificar contratos públicos de la API, compatibilidad mantenida con la versión publicada.

---

## Resumen Ejecutivo

ComparaFarma ya tenía, antes de este sprint, una base operacional razonable: CI con 4 jobs, monitoreo horario de la API, manejo de errores sin fugas de información sensible al cliente, y un historial de sprints previos (REL-002, REL-003, REL-004) que ya habían cerrado los riesgos de seguridad más obvios (endpoint de debug protegido, logging de PII en feedback/alertas saneado).

Este sprint auditó seis áreas (logging, healthcheck, manejo de errores, performance, variables de entorno, CI/CD) mediante seis investigaciones paralelas de solo lectura, y luego implementó las correcciones que podían hacerse con seguridad **sin tocar el comportamiento observable de la API ni de las apps**. Se crearon los 4 documentos operacionales solicitados y se corrigieron 3 inconsistencias documentales concretas. Quedan pendientes, documentados explícitamente en la sección de Riesgos, los cambios que requerían más riesgo (una optimización de latencia que necesita verificarse en un entorno real de Vercel) o más alcance del que es razonable resolver en una sola sesión (limpieza completa de la gobernanza documental, que este mismo repo ya trata como trabajo de sprints dedicados).

**El sistema queda en un estado sensiblemente mejor del que tenía al iniciar este sprint, pero no en un estado "perfecto" — hay una lista corta y honesta de lo que falta.**

---

## Hallazgos (por criticidad, al momento de iniciar la auditoría)

### Crítico
- Ninguno nuevo. Los riesgos de criticidad crítica de sprints anteriores (endpoint debug sin protección, PII en logs de feedback/email) ya estaban cerrados desde REL-002/REL-003.

### Alto
1. **Logging con riesgo de PII no cubierto por REL-003**: `api/src/routes/subscriptions.ts` logueaba el `purchaseToken` de Google Play y el `flowCustomerId` completos en texto plano, y el body completo de respuestas fallidas de Flow. `api/src/lib/feedbackDb.ts` y `api/src/lib/emailAlertsDb.ts` (13 archivos en total) logueaban `error.message` de Postgres sin sanitizar — riesgo teórico de eco de datos personales en violaciones de constraint sobre tablas con columnas `email`/`message`.
2. **Deploy sin verificación post-deploy**: `ci.yml` desplegaba a producción sin ningún smoke test — el primer aviso real de un deploy roto era el monitor horario (hasta 1 hora de exposición), el mismo patrón que causó el incidente documentado en `PM-001_DEPLOY_PIPELINE_BROKEN.md`.
3. **Monitor de API sin umbral de severidad**: una sola farmacia caída (de 9) se trataba igual que una caída total de la API — cada fallo horario persistente generaba un issue nuevo sin deduplicación, con riesgo de fatiga de alertas.
4. **Escritura bloqueante en el camino caliente de `/api/search`**: el `await` a `recordPriceHistory()` (Supabase) y a `setCachedSearch()` (Redis) bloquea la respuesta HTTP por efectos secundarios que el cliente nunca ve en el body.

### Medio
5. Documentación desfasada: `CLAUDE.md` afirmaba (sin haberse commiteado todavía) que 4 documentos de `docs/product/` "no existen todavía" cuando ya existían y estaban indexados. `docs/normalization.md` describía la deduplicación de precios incorrectamente (por `fetchedAt` en vez de por `channels.effective`). Tres documentos de `docs/release/` seguían describiendo versionCode 30 sin marcarse como obsoletos frente al versionCode 31 actual.
6. Inconsistencias menores de forma en el manejo de errores: `branches.ts`/`config.ts` responden 405 sin body; `go.ts` responde en texto plano en vez de JSON; falta de tildes sistemática en los mensajes de `HttpError` de `search.ts`/`priceHistory.ts` frente al resto de rutas.
7. `check-price-alerts.yml` y `ci.yml` sin bloques `permissions:` mínimos explícitos.
8. `/api/health` no exponía información operacional útil (versión, commit, entorno, estado de dependencias, memoria) — solo `ok`/`timestamp`.
9. Ausencia de documentación operacional: no existía ni `RUNBOOK.md`, ni `ENVIRONMENT.md`, ni un `RELEASE_CHECKLIST.md` formal.
10. 5 variables de entorno usadas en código (`FEEDBACK_EMAIL`, `DISABLED_PHARMACIES`, `ALLOWED_ORIGINS`, `KHIPU_RECEIVER_ID`, `KHIPU_SECRET`) no estaban documentadas en `api/.env.example`.

### Bajo
11. Búsquedas de alertas de precio (`action=check`) procesadas secuencialmente pese a ser independientes entre sí.
12. Recomputación innecesaria de `queryWords` en cada iteración de un `flatMap` en `api/src/clients/drsimi.ts`.
13. `getSearchParam()` reconstruye el mismo objeto `URL` varias veces por request en `search.ts`/`priceHistory.ts`.
14. Duplicación de código entre `email.ts` y `feedback.ts` (ambos implementan su propia llamada a Resend).
15. Colisión de numeración `RFC-002` entre `docs/architecture/` y `docs/engineering/rfc/`; issues `CF-101` a `CF-107`/`CF-109`/`CF-110` marcados "Pendiente" pese a estar implementados hace semanas; `docs/README.md` y `docs/product/README.md` sin indexar ~10 dominios/documentos reales creados en las últimas semanas; 6 documentos vacíos en `docs/product/` sin decisión sobre su destino.

---

## Cambios implementados

### Logging (Alto #1)
- Creado `api/src/lib/logger.ts` (`sanitizeForLog`, `logWarn`, `logError`) — redacta patrones de email y tokens/IDs largos antes de loguear, y trunca a 300 caracteres.
- Aplicado en 13 archivos de la capa DB/infraestructura de `api/src/lib/` y `api/src/middleware/rateLimit.ts` (55 call-sites reemplazados), eliminando la duplicación de ~50 líneas casi idénticas de `console.warn`.
- `api/src/routes/subscriptions.ts`: el `purchaseToken` y el `flowCustomerId` ahora se loguean truncados (primeros 8 caracteres + longitud/elipsis); el body de respuestas fallidas de Flow ahora loguea solo las claves de nivel superior, no los valores.
- Verificado: `tsc --noEmit` limpio, 182/182 tests en verde tras el cambio.

### Health Check (Medio #8)
- `GET /api/health` ahora incluye, de forma aditiva (sin cambiar el significado de `ok`, que sigue siendo compatible con el monitor existente): `environment`, `commit` (7 caracteres del SHA de Vercel), `uptimeSeconds`, `memoryMb.{rss,heapUsed}`, y `dependencies.{redis,supabase,algolia}` con ping real (timeout 1.5s) para Redis/Supabase y verificación de configuración para Algolia. Ningún secreto se expone en la respuesta.

### Performance (Alto #4 parcial, Bajo #11/#12)
- Implementado: `api/src/clients/drsimi.ts` calcula `queryWords` una sola vez fuera del `flatMap` (Bajo #12).
- Implementado: `api/src/routes/alerts.ts` (`handleCheck`) procesa los grupos de alertas por medicamento con concurrencia acotada a 3 en vez de secuencialmente (Bajo #11) — mismo resultado, mismos emails enviados, solo más rápido.
- **No implementado** (Alto #4, la optimización de mayor impacto identificada): mover `recordPriceHistory()`/`setCachedSearch()` a background tasks (`waitUntil`) para no bloquear la respuesta de `/api/search`. Ver Riesgos Pendientes.

### GitHub Actions (Alto #2, #3, Medio #7)
- `ci.yml`: agregado smoke test post-deploy (3 reintentos, `curl` a `/api/health`, falla el job si no responde `ok:true`), bloque `permissions: { contents: read }`, y `concurrency` para el job `deploy-api`.
- `check-price-alerts.yml`: agregado `permissions: {}`.
- `api/scripts/check-production-health.mjs`: agregado reintento (1 retry, 2s de espera) antes de marcar una farmacia como caída, y un umbral de severidad (`warning` para 1-2 farmacias aisladas, sin crear issue; `critical` para 3+ o `/api/health` caído, comportamiento anterior sin cambios).
- `monitor-api.yml`: la creación de issues ahora deduplica — busca un issue abierto con label `monitoring` y comenta en él en vez de crear uno nuevo si ya existe.

### Documentación (Medio #5, #9, #10)
- `CLAUDE.md` corregido para reflejar que los 5 documentos de PHASE 2 (`docs/product/`) ya existen.
- `docs/normalization.md` corregido: la deduplicación de precios usa `channels.effective` (menor precio), no `fetchedAt` (más reciente).
- `docs/release/RELEASE_READINESS_V1.md`, `PLAY_CONSOLE_CHECKLIST.md` y `PRODUCTION_BLOCKERS_PLAN.md` marcados explícitamente como Obsoletos/Superseded por `docs/launch/PRODUCTION_READINESS_REVIEW.md` (y por el nuevo `RELEASE_CHECKLIST.md` en el caso del checklist de Play Console).
- `api/.env.example` actualizado con las 5 variables huérfanas (`FEEDBACK_EMAIL`, `DISABLED_PHARMACIES`, `ALLOWED_ORIGINS`, `KHIPU_RECEIVER_ID`, `KHIPU_SECRET`).
- Creados: `docs/operations/ENVIRONMENT.md`, `docs/operations/RUNBOOK.md`, `docs/release/RELEASE_CHECKLIST.md`, y este mismo informe.

---

## Riesgos Pendientes

Documentados con honestidad — nada de esto se implementó, y se explica por qué:

1. **Optimización `waitUntil` para `/api/search` (Alto #4)**: no se implementó porque requiere el paquete `@vercel/functions` y verificación real de que el runtime serverless de Vercel no congela el contenedor antes de completar la escritura en segundo plano — algo que no se puede probar de forma confiable fuera de un despliegue real a Vercel. Implementarlo sin esa verificación arriesgaba perder silenciosamente historial de precios o entradas de caché. **Recomendación**: implementar y probar en un deploy a Preview antes de llevarlo a Production.
2. **Contradicción documental sobre el estado de Prueba Cerrada**: `docs/actas/20260805.md` afirma que la Prueba Cerrada terminó y la app está lista para Producción; `docs/launch/PRODUCTION_READINESS_REVIEW.md` (más reciente) trata esa afirmación como no verificable y mantiene el veredicto `NOT READY` para `mobile/`. Esta auditoría no resuelve esa contradicción — requiere una confirmación humana directa en Play Console, no otro documento.
3. **Limpieza completa de gobernanza documental** (Bajo #15): la colisión de numeración RFC-002, el cierre formal de CF-101 a CF-110, la reindexación de `docs/README.md`/`docs/product/README.md`, y la decisión sobre los 6 documentos vacíos de `docs/product/` no se resolvieron en este sprint. Cada uno de estos, en sprints anteriores de este mismo proyecto, se trató como su propio sprint dedicado (ver `docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`) — intentar resolverlos de pasada aquí habría sido apresurado.
4. **Inconsistencias de forma en manejo de errores** (Medio #6): no se corrigieron `branches.ts`/`config.ts` (405 sin body), `go.ts` (texto plano) ni las tildes faltantes en `search.ts`/`priceHistory.ts`, porque cualquiera de esos cambios modifica el shape exacto de una respuesta de error existente — y la restricción explícita de este sprint fue no modificar contratos públicos de la API. Quedan como recomendación para un sprint que sí tenga ese cambio en su alcance explícito.
5. **Duplicación `email.ts`/`feedback.ts`** (Bajo #14): no se unificó — `feedback.ts` podría migrar a usar `sendEmail()` de `email.ts` en vez de su propio código, pero no se tocó para minimizar el riesgo de cambiar el comportamiento de un flujo que maneja el email de contacto de usuarios reales.
6. **Verificación real de `expo-doctor`/`expo install --check`**: sigue bloqueada por falta de acceso de red a `exp.host`/`api.expo.dev` desde este entorno (mismo hallazgo ya señalado en la auditoría RC-02).

---

## Recomendaciones

- Antes de la próxima publicación de `api/`, ejecutar el `RELEASE_CHECKLIST.md` completo por primera vez y usar el registro de la sección final para empezar a construir historial.
- Resolver la contradicción del punto 2 de Riesgos Pendientes antes de tomar cualquier decisión de negocio que asuma que `mobile/` ya puede publicarse en Producción.
- Planificar un sprint dedicado exclusivamente a la limpieza de gobernanza documental (punto 3) — no combinarlo con trabajo de código, siguiendo el patrón que este mismo proyecto ya usa exitosamente (sprints DG.001/DG.002, UX.2-UX.5).
- Implementar y verificar en Preview la optimización `waitUntil` (punto 1) en una sesión donde se pueda desplegar y probar contra Vercel real.
- Considerar agregar un `feedback.test.ts`/`email.test.ts` dedicado que verifique el contenido de los logs saneados en este sprint (hoy ningún test los cubre directamente, aunque tampoco los rompe).

---

## Veredicto

**READY WITH MINOR OBSERVATIONS**

El proyecto queda operacionalmente mejor preparado de lo que estaba: logging de PII saneado en los puntos encontrados, healthcheck útil para diagnóstico real, CI/CD con verificación post-deploy y monitoreo con umbral de severidad, y documentación operacional (`ENVIRONMENT.md`, `RUNBOOK.md`, `RELEASE_CHECKLIST.md`) que antes no existía. No se encontró ningún hallazgo Crítico nuevo. Los puntos que quedan abiertos (sección Riesgos Pendientes) son reales pero acotados, están documentados con la razón exacta por la que no se resolvieron ahora, y ninguno de ellos es, por sí solo, motivo para bloquear la operación actual del sistema — sí son motivo para no declarar el proyecto "perfecto" o cerrar el tema por completo.
