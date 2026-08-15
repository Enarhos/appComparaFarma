# Auditoría de Infraestructura de Producción — ComparaFarma

**Tipo:** Documento permanente de gobierno operacional
**Fecha:** 2026-08-13
**Autor:** Auditoría solicitada por el CTO (agente de investigación, sin permiso de escritura de código)
**Alcance:** Todos los servicios/infraestructura externos usados en producción por `mobile/`, `api/`, `web/` y `packages/domain/`.
**Método:** Inspección directa del repositorio (`package.json` de cada workspace, `.github/workflows/*.yml`, `vercel.json`, `.env*.example`, `api/src/lib/`, `api/src/clients/`, `api/src/middleware/`, `docs/`) + verificación cruzada con documentación oficial de cada proveedor (WebSearch/WebFetch) + dos hechos confirmados en vivo por el CTO en esta misma sesión (Supabase Dashboard, cuenta Resend).
**Regla de evidencia:** cada afirmación cita archivo+contenido real o URL de documentación oficial. Donde no hay evidencia, se escribe literalmente **No verificable**. Ningún valor de secreto/API key/token/contraseña aparece en este documento — solo nombres de variables y su estado (presente/vacía/ausente).

> **Trazabilidad (2026-08-13):** el inventario de servicios de este documento (evidencia, planes, riesgos por servicio) queda consolidado como punto de entrada único en `docs/operations/PLATFORM_SERVICE_CATALOG.md` (OPS-SVC-001). Ese catálogo no repite esta evidencia — la referencia. Esta auditoría sigue siendo la fuente oficial de los hallazgos y su metodología.

> **Trazabilidad (2026-08-15):** tras el sprint de cierre operacional que revisó y validó cada hallazgo de esta Auditoría contra el código/configuración real, `docs/operations/PLATFORM_OPERATIONAL_STATUS.md` (OPS-STATUS-001) es el estado operacional consolidado vigente — dos hallazgos de esta Auditoría fueron reclasificados ahí y en las fichas correspondientes (#16, SPOF #5: keystore de Android, de Crítico a Medio, tras confirmarse Google Play App Signing habilitado). Esta Auditoría no se reescribe retroactivamente salvo esas dos correcciones puntuales, marcadas inline donde ocurren.

> **Nota de higiene del repositorio (corregida 2026-08-13 — ver Sprint "Operational Hardening 1.0"):** durante el descubrimiento se detectaron carpetas en la raíz del repo que no corresponden a la arquitectura documentada en `CLAUDE.md` (`audit-package/`, `tmp-spike-001/`, `tmp-task-004/`, `ml_borrar/`, `_CLAUDE_TMP_BORRAR/`). Parecen artefactos de trabajo temporal, no infraestructura real — se excluyen de este inventario, pero se señalan porque su presencia en `main` es en sí un hallazgo de higiene operacional (ver sección Seguridad Operacional). **`scripts-temp/` fue retirada de esta lista** — la clasificación original de esta auditoría era incorrecta: verificado en código real, `scripts-temp/fetch-branches.js` es invocado en vivo por `.github/workflows/update-branches.yml` (cron diario de datos MINSAL) y `scripts-temp/build-android-release.ps1` es el script real detrás de `pnpm build:android` (`package.json` raíz) — ambos ya documentados como evidencia en las fichas #13 (MINSAL) y #15 (Android Studio + build local) de este mismo documento. `scripts-temp/` es infraestructura operativa real, no una carpeta de limpieza — no debe eliminarse.

---

## Resumen de Descubrimiento (Paso 1)

Servicios/infraestructura externos confirmados con evidencia directa en el repositorio:

| # | Servicio | Evidencia primaria |
|---|---|---|
| 1 | Vercel — proyecto `comparafarma-api` | `.github/workflows/ci.yml` (`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `vercel deploy --prod`), `api/vercel.json` |
| 2 | Vercel — proyecto `comparafarma-web` | `docs/operations/RUNBOOK.md` ("proyecto Vercel propio, deploy automático... no pasa por `ci.yml`"), `web/.env.example` (`SITE_URL`) |
| 3 | Supabase (Postgres + Auth) | `api/package.json` (`@supabase/supabase-js`), `web/package.json` (`@supabase/ssr`), `mobile/package.json` (`@supabase/supabase-js`), `api/src/lib/supabaseClient.ts`, `docs/database/schema.sql`, hecho confirmado en vivo por el CTO (Dashboard → Authentication → Rate Limits) |
| 4 | Upstash Redis | `api/package.json` (`@upstash/redis`), `api/src/lib/cache.ts`, `api/src/middleware/rateLimit.ts` |
| 5 | Sentry (backend) | `api/package.json` (`@sentry/node`), `api/src/lib/sentry.ts` |
| 6 | Sentry (mobile) | `mobile/package.json` (`@sentry/react-native`), `mobile/src/app/_layout.tsx` (`Sentry.init`) |
| 7 | Algolia (índice de Salcobrand) | `api/.env.example` (`ALGOLIA_APP_ID`/`ALGOLIA_API_KEY`, comentario "Salcobrand search index"), `api/src/clients/salcobrand.ts` (`INDEX = "sb_variant_production"`) |
| 8 | Resend | `api/src/lib/email.ts` (llamada REST directa a `api.resend.com`, dominio `onboarding@resend.dev`), `api/.env.example` (`RESEND_API_KEY`) |
| 9 | Khipu | `api/src/clients/khipu.ts` (`KHIPU_RECEIVER_ID`/`KHIPU_SECRET`, `https://khipu.com/api/2.0/payments`), `api/src/routes/donate.ts` |
| 10 | Flow (Chile, pagos recurrentes) | `api/src/lib/adapters/flowAdapter.ts`, `api/.env.example` (`FLOW_API_KEY`/`FLOW_SECRET_KEY`/`FLOW_API_BASE_URL`), `docs/engineering/adr/ADR-0004_FLOW_SUBSCRIPTION_INTEGRATION.md` |
| 11 | Google Play Console + Google Play Billing/RTDN | `mobile/app.json` (`package: mla.app.comparafarma`, `versionCode: 31`), `api/src/lib/adapters/googlePlayAdapter.ts`, `api/.env.example` (`GOOGLE_RTDN_SECRET`) |
| 12 | GitHub (repo) + GitHub Actions | `.github/workflows/ci.yml`, `monitor-api.yml`, `check-price-alerts.yml`, `update-branches.yml`; remoto real `github.com/Enarhos/appComparaFarma.git` |
| 13 | GitHub Pages | `CLAUDE.md` ("Política de privacidad: `https://enarhos.github.io/appComparaFarma/privacy-policy.html`"), `docs/privacy-policy.html` |
| 14 | Expo / EAS (build + OTA updates) | `mobile/app.json` (`extra.eas.projectId`, `updates.url: https://u.expo.dev/...`), `mobile/eas.json`, `package.json` raíz (`build:android` como alternativa local) |
| 15 | PostHog (analytics mobile) | `mobile/package.json` (`posthog-react-native`), `mobile/src/lib/analytics.ts` (proyecto US cloud, `host: https://us.i.posthog.com`) |
| 16 | MINSAL (dato público del Estado de Chile) | `api/src/clients/minsal.ts`, `.github/workflows/update-branches.yml`, comentario en código: "MINSAL bloquea IPs de Vercel en runtime" |
| 17 | 9 sitios de farmacias (fuentes de scraping/API no controladas) | `api/src/clients/{cruzverde,salcobrand,ahumada,drsimi,araucomed,ecofarmacias,farmex,sermecoop,easyfarma}.ts` |
| 18 | Android Studio (build local) | `package.json` raíz (`"build:android": "pwsh scripts-temp/build-android-release.ps1"`), `CLAUDE.md` ("Requiere: Android Studio instalado") |
| 19 | Keystore de firma Android (`release.keystore`) | `docs/operations/RUNBOOK.md` §5, §8; `docs/release/RELEASE_CHECKLIST.md` (verificación SHA-1/SHA-256) |

Se revisaron además, sin encontrar evidencia de uso adicional: CDN dedicado (Vercel provee el suyo por defecto), WAF, servicio de colas/mensajería propio (Google Cloud Pub/Sub aparece solo como transporte de RTDN de Google, gestionado por Google, no una cuenta propia de GCP), y ningún proveedor de IA/LLM en `api/`/`web`/`mobile` (no hay SDKs de OpenAI/Anthropic/etc. en ningún `package.json`).

**Concentración de cuentas (hallazgo transversal):** `docs/release/SERVICE_ACCOUNT_MIGRATION.md` (documento ya existente en el repo, v1.1, 2026-08-02) declara explícitamente que **11 servicios externos** deben o ya están consolidados bajo una única cuenta personal (`mario.lillo.alfaro@gmail.com`), y lista Vercel, Expo/EAS, Google Play, GitHub, Sentry, PostHog, Upstash, Khipu, Resend como parte de esa consolidación. `web/.env.example` confirma esto de forma independiente: `ADMIN_ALLOWED_EMAILS=mario.lillo.alfaro@gmail.com` es el único email con acceso al panel `/admin`. Esto se retoma en la sección Single Points of Failure.

---

## Fichas por Servicio (Paso 2)

### 1. Vercel — `comparafarma-api`

1. **Nombre:** Vercel (proyecto `comparafarma-api`)
2. **Función:** Hosting serverless del backend. Ejecuta las 9 integraciones de farmacias, normaliza/deduplica resultados, sirve `/api/search`, `/api/health`, `/api/alerts`, `/api/subscriptions`, `/api/donate`, `/api/config`, `/api/feedback`, `/api/price-history`, `/api/branches`, `/api/go`. `mobile/` y `web/` dependen de él para toda búsqueda.
3. **Tipo:** Hosting / Deployment / CI-CD
4. **Evidencia:** `.github/workflows/ci.yml` líneas del job `deploy-api` (`VERCEL_ORG_ID: team_QtbvbI6hTSxxSJ9qDFTv9z6S`, `VERCEL_PROJECT_ID: prj_zvHG2urEOjMM770FPy6B2fdhk915`, `vercel deploy --prod --yes`); `api/vercel.json` (`"functions": {"api/*.ts": {"maxDuration": 30}}`); `docs/engineering/postmortems/PM-001_DEPLOY_PIPELINE_BROKEN.md` confirma el error real "No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan" obtenido en producción.
5. **Plan actual:** **Hobby** (confirmado por el mensaje de error citado en PM-001, específico de ese plan).
6. **Limitaciones (Hobby, documentación oficial Vercel):**
   - Máximo 12 funciones serverless por deployment ([vercel.com/docs/functions/limitations](https://vercel.com/docs/functions/limitations); error reproducido en PM-001). `api/vercel.json` ya mitiga esto con el glob `api/*.ts` para no contar cada archivo de `src/` como función independiente — hoy son 9 entrypoints reales (`search.ts`, `health.ts`, `alerts.ts`, `subscriptions.ts`, `donate.ts`, `config.ts`, `feedback.ts`, `price-history.ts`, `branches.ts`, `go.ts` — 10 archivos en `api/api/`, ver listado de descubrimiento), cerca del límite de 12.
   - `maxDuration`: con Fluid Compute (activado por defecto en proyectos nuevos), el default y máximo en Hobby es 300s ([vercel.com/docs/functions/limitations](https://vercel.com/docs/functions/limitations)). El valor configurado en `api/vercel.json` (30s) es una autolimitación del proyecto, no el techo real del plan — **No verificable** si Fluid Compute está activo específicamente para este proyecto (no hay forma de confirmarlo desde el repo).
   - Memoria máxima: 2 GB / 1 vCPU (igual en Hobby y Pro por defecto).
   - Tamaño de bundle: 250 MB sin comprimir.
   - 100 GB de bandwidth incluido, 1 build concurrente (fuente: [deploywise.dev/blog/vercel-free-tier-limits-2026](https://deploywise.dev/blog/vercel-free-tier-limits-2026); cifra de terceros, no oficial — tratar como orientativa).
7. **Riesgo:** 🟡 Medio. El sistema ya sufrió una caída total de `/api/search` por un problema de deploy (PM-001) que no fue detectado por el monitor automático durante horas. El límite de 12 funciones está cerca de agotarse si se agregan más rutas.
8. **Dependencias:** Servicio inutilizable para `mobile/` y `web/` si cae — es el único backend, no hay entorno de respaldo ni segunda región. `web/` puede renderizar sin resultados de búsqueda (impacto parcial en SEO/contenido estático) pero la funcionalidad central de la app depende 100% de este servicio.
9. **Escalabilidad:**
   - 100–1.000 usuarios: sin problema esperado, dentro de límites de Hobby.
   - 10.000 usuarios: dependiendo del patrón de uso, el límite de invocaciones (~100K/mes citado por fuentes de terceros, no oficial) y el bandwidth de 100GB podrían empezar a ajustar. Rate limiting propio (`RATE_LIMIT_MAX=60`/min por defecto) ya actúa como control.
   - 100.000 usuarios: **No verificable** sin datos reales de tráfico; requeriría upgrade a plan Pro casi con certeza (funciones ilimitadas, más bandwidth, más concurrencia).
10. **Recomendación:** Mantener Hobby mientras el tráfico sea bajo, pero planificar el upgrade a Pro *antes* de cualquier campaña de adquisición de usuarios significativa — no como reacción a una caída. Agregar el smoke test post-deploy ya implementado (ver `docs/release/RC-03_PRODUCTION_READINESS_REPORT.md`) es una mitigación correcta ya en marcha, mantenerla.

### 2. Vercel — `comparafarma-web`

1. **Nombre:** Vercel (proyecto Vercel propio para `web/`, nombre exacto del proyecto no confirmado en el repo — se infiere `comparafarma-web` por convención de nombres usada en `docs/operations/RUNBOOK.md` y `ENVIRONMENT.md`).
2. **Función:** Hosting del sitio Next.js (SEO, resultados de búsqueda server-rendered, flujos de cuenta — login/registro/recuperar clave —, panel `/admin`).
3. **Tipo:** Hosting / Deployment
4. **Evidencia:** `docs/operations/RUNBOOK.md`: "Web (`web/`): `https://app-compara-farma-web.vercel.app` — proyecto Vercel propio (deploy automático de Vercel al detectar push, no pasa por `ci.yml`)"; `.github/workflows/ci.yml` job `web-build` solo hace `typecheck`+`build` de verificación, **no despliega** `web/`.
5. **Plan actual:** No verificable directamente desde el repo (no hay workflow de deploy que declare el plan). Dado que es una cuenta personal consolidada con `comparafarma-api` (ver `SERVICE_ACCOUNT_MIGRATION.md`), es razonable asumir Hobby, pero no hay evidencia directa — **No verificable**.
6. **Limitaciones:** Mismas limitaciones generales de Vercel Hobby que la ficha anterior (si el plan es Hobby). Next.js 16 App Router puede generar más funciones/Edge Middleware que cuentan contra el mismo límite de 12 si el plan fuese Hobby — **No verificable** cuántas funciones genera el build de `web/` sin ver el output real de un deploy.
7. **Riesgo:** 🟡 Medio. El despliegue de `web/` corre completamente fuera del control de `ci.yml` (sin smoke test, sin gate de tests) — un push a la rama conectada se publica directo a producción sin que pasen `typecheck`/`test` de `web/` como gate real de bloqueo (el job `web-build` de CI es informativo, corre en paralelo, no bloquea el deploy de Vercel).
8. **Dependencias:** Impacto parcial si cae — `mobile/` no depende de `web/` en absoluto (consume solo `api/`). El flujo de recuperación de contraseña, registro, y el panel `/admin` (gestión de `disabled_pharmacies`, banner de donación, feedback) sí dependen de `web/`.
9. **Escalabilidad:** Igual a Vercel en general — Next.js con SSR es más intensivo en cómputo que `api/` (funciones puras de agregación), así que el costo por request tiende a ser mayor a partir de 10.000+ usuarios. **No verificable** con datos reales de tráfico.
10. **Recomendación:** Agregar un gate real (no solo informativo) entre el job `web-build` de CI y el deploy de Vercel — hoy un typecheck roto en `web/` no impide que Vercel publique igual, a diferencia de `api/` que sí tiene ese gate vía `needs: [typecheck, domain-tests, api-tests]`.

### 3. Supabase

1. **Nombre:** Supabase
2. **Función:** Base de datos Postgres (historial de precios, config de la app, feedback, suscripciones, planes, clientes de Flow) y proveedor de autenticación (login/registro/recuperación de clave en `web/` y `mobile/`, OAuth Google para `/admin`).
3. **Tipo:** Database / Authentication
4. **Evidencia:** `api/src/lib/supabaseClient.ts` (cliente server-side con `SUPABASE_SECRET_KEY`, bypassea RLS); `web/src/lib/supabase/admin.ts` (mismo patrón); `mobile/src/lib/supabase.ts` (cliente cliente con `EXPO_PUBLIC_SUPABASE_ANON_KEY` + almacenamiento cifrado AES-256 vía `expo-secure-store`); `docs/database/schema.sql` (tablas `price_history`, `pharmacy_clicks`, `app_config`, `feedback`, y — según `api/src/lib/subscriptionsDb.ts` — `subscription_plans`, `subscriptions`, `subscription_events`, `profiles`, `flow_customers`); `web/.env.example` expone la URL pública del proyecto real: `https://xzdtpypctyntkgmoceum.supabase.co` (URL, no secreto — necesaria como `NEXT_PUBLIC_SUPABASE_URL`).
5. **Plan actual:** **Free**, confirmado en vivo por el CTO en esta sesión (Dashboard → Authentication → Rate Limits, "Rate limit for sending emails: 2 emails/h" — límite específico y documentado del servicio de email integrado del plan Free/por defecto de Supabase).
6. **Limitaciones (plan Free, oficial + confirmación en vivo del CTO):**
   - Envío de email de Auth integrado: **2 emails/hora para todo el proyecto** (no por usuario) — confirmado visualmente por el CTO en el Dashboard, y documentado independientemente: "el servicio de email integrado de Supabase no está pensado para producción, sin SLA" ([supabase.com/docs/guides/deployment/going-into-prod](https://supabase.com/docs/guides/deployment/going-into-prod); ver también [github.com/supabase/supabase issue #34209](https://github.com/supabase/supabase/issues/34209)). Con SMTP propio configurado, el límite sube a 30 usuarios nuevos/hora — pero **eso no está configurado hoy** (ver ficha Resend, y hallazgo detallado más abajo en Single Points of Failure).
   - Almacenamiento de base de datos: 500 MB en instancia compartida.
   - Proyectos gratuitos se **pausan tras 1 semana sin requests** — los datos se retienen pero el proyecto queda offline hasta reanudarlo manualmente (fuente: búsqueda agregada de terceros sobre plan Free 2026, no verificado contra la doc oficial de Supabase directamente — tratar como orientativo, no confirmado con URL oficial específica).
   - 50.000 usuarios activos mensuales de Auth, 500.000 invocaciones de Edge Functions (no usadas en este proyecto), 200 conexiones realtime concurrentes (no usadas).
7. **Riesgo:** 🔴 Alto. El límite de 2 emails/hora afecta directamente la recuperación de contraseña y confirmación de registro — funcionalidad de identidad recién implementada según los tasks activos de esta sesión ("Validation Sprint 01: Recuperar contraseña"). Con más de 2 solicitudes de recuperación de clave en la misma hora (proyecto completo, no por usuario), las siguientes fallan silenciosamente o se retrasan.
8. **Dependencias:** Impacto parcial si el email de Auth falla (login por password ya existente sigue funcionando, búsqueda anónima no se ve afectada — `mobile/src/lib/supabase.ts` documenta explícitamente que la app funciona 100% anónima si Supabase no está configurado). Servicio inutilizable para historial de precios/`app_config`/feedback/suscripciones si el proyecto se pausa o cae — todos con degradación silenciosa documentada en `docs/operations/ENVIRONMENT.md` (caen a `null`/`[]`, nunca lanzan).
9. **Escalabilidad:** A 100 usuarios el límite de 2 emails/hora ya es insuficiente en momentos de uso simultáneo (ej. lanzamiento con invitación masiva). A 1.000+ usuarios es un bloqueo funcional seguro para cualquier flujo de onboarding con recuperación de clave. El límite de 500MB de DB es improbable que se alcance solo con `price_history`/`app_config`/`feedback` incluso a 100.000 usuarios (son tablas de agregados, no de contenido pesado), pero si `subscriptions`/`subscription_events` crecen con alto volumen de eventos de pago, podría acercarse antes.
10. **Recomendación:** **Prioridad 1** — conectar un SMTP propio a Supabase Auth antes de escalar usuarios. Ver hallazgo detallado en Single Points of Failure sobre por qué conectar el Resend actual (dominio sandbox) no resuelve esto de forma completa.

### 4. Upstash Redis

1. **Nombre:** Upstash Redis
2. **Función:** Caché de resultados de búsqueda (TTL configurable, default 5 min) y rate limiting distribuido entre invocaciones serverless. Con fallback a memoria si no está configurado.
3. **Tipo:** Backend / Storage (caché)
4. **Evidencia:** `api/src/lib/cache.ts`, `api/src/middleware/rateLimit.ts` (`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`); confirmado con valor asignado en `.env.vercel.production` real (nombre de variable presente, no su valor).
5. **Plan actual:** No verificable directamente (no hay indicio de tier en el código). Dado el volumen de tráfico descrito en el proyecto (búsquedas + rate limit), es razonable un tier Free, pero **No verificable**.
6. **Limitaciones (Free, oficial Upstash):** 500.000 comandos/mes, 256 MB de datos, 10 GB de bandwidth ([upstash.com/docs/redis/overall/pricing](https://upstash.com/docs/redis/overall/pricing)). El modelo cambió de un límite diario a uno mensual en marzo de 2025.
7. **Riesgo:** 🟢 Bajo — el propio código tiene fallback a memoria si Redis falla o no está configurado (`cache.ts`/`rateLimit.ts`, ambos con `try/catch` explícito). Degradación, no caída.
8. **Dependencias:** Impacto parcial si falla — el caché de búsqueda cae a memoria (más lento entre invocaciones frías, pero funcional); el rate limiting cae a memoria por instancia serverless (menos preciso, pero sigue limitando). `docs/operations/RUNBOOK.md` documenta esto explícitamente.
9. **Escalabilidad:** A 100–1.000 usuarios, sin riesgo. A 10.000+ usuarios con búsquedas frecuentes, el límite de 500K comandos/mes del tier Free podría alcanzarse (cada búsqueda implica al menos 1 `get` + 1 `set` de caché + 1 `incr` de rate limit = ~3 comandos por búsqueda no cacheada). A 100.000 usuarios, upgrade casi seguro necesario.
10. **Recomendación:** Sin cambios por ahora — el diseño con fallback ya es robusto. Monitorear el uso de comandos en el dashboard de Upstash antes de que el tráfico crezca significativamente, para anticipar el upgrade en vez de reaccionar a un fallo silencioso de degradación a memoria.

### 5. Sentry (backend + mobile — dos proyectos)

1. **Nombre:** Sentry
2. **Función:** Reporte de excepciones no controladas. Backend: `captureException()` en rutas críticas (ej. `/api/donate`). Mobile: captura de errores de la app en producción (`enabled: !__DEV__`).
3. **Tipo:** Monitoring / Logging
4. **Evidencia:** `api/src/lib/sentry.ts` (`@sentry/node`, condicional a `SENTRY_DSN`, `tracesSampleRate: 0.2`); `mobile/src/app/_layout.tsx` (`@sentry/react-native`, `Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, enabled: !__DEV__, tracesSampleRate: 0.2 })`); `CLAUDE.md` confirma "proyecto `comparafarma-api` en sentry.io, región US".
5. **Plan actual:** No verificable directamente el nombre del plan, pero el patrón (condicional a DSN, sin mención de límites configurados) sugiere plan gratuito ("Developer"). **No verificable con certeza.**
6. **Limitaciones (plan Developer/Free, oficial Sentry):** 5.000 errores/mes; eventos que excedan el límite se descartan silenciosamente sin cobro adicional ([Spike Protection docs, docs.sentry.io/product/accounts/quotas/spike-protection](https://docs.sentry.io/product/accounts/quotas/spike-protection); cifra de 5.000/mes reportada por múltiples fuentes de terceros 2026, no verificada contra una página oficial de pricing específica en esta sesión — tratar como orientativa).
7. **Riesgo:** 🟢 Bajo — es no-op explícito si `SENTRY_DSN`/`EXPO_PUBLIC_SENTRY_DSN` no están configurados (`api/src/lib/sentry.ts` línea 14: `if (!dsn) return;`), nunca bloquea funcionalidad.
8. **Dependencias:** Sin impacto funcional si falla — solo se pierde visibilidad de errores, no hay degradación de producto.
9. **Escalabilidad:** A volumen alto de tráfico con errores recurrentes (ej. un scraper de farmacia rompiéndose repetidamente), el límite de 5.000 eventos/mes puede agotarse rápido y ocultar señal real detrás de Spike Protection. **No verificable** el volumen real actual de eventos.
10. **Recomendación:** Sin cambios mientras el volumen de errores sea bajo. Revisar el dashboard de Sentry periódicamente para confirmar que no se están descartando eventos por Spike Protection sin que nadie lo note.

### 6. Algolia (índice de Salcobrand)

1. **Nombre:** Algolia
2. **Función:** Motor de búsqueda usado para consultar el catálogo de Salcobrand (`sb_variant_production`). Es la única farmacia de las 9 que se consulta vía un motor de búsqueda de terceros en lugar de scraping/API propia.
3. **Tipo:** Search
4. **Evidencia:** `api/src/clients/salcobrand.ts` línea 6 (`const INDEX = "sb_variant_production"`); `api/.env.example` comentario explícito: "Algolia — Salcobrand search index (GM3RP06HJG / sb_variant_production)".
5. **Plan actual:** No es una cuenta de ComparaFarma — son credenciales del propio índice de búsqueda de Salcobrand, expuestas públicamente en su storefront (patrón común de Algolia con API keys de solo-búsqueda del lado del cliente). **No verificable** qué plan tiene Salcobrand contratado, y **es una dependencia fuera del control operacional de ComparaFarma** — Salcobrand puede rotar o restringir esas credenciales sin aviso.
6. **Limitaciones:** Si el plan real fuera el tier gratuito de Algolia ("Build"), el límite documentado es 10.000 búsquedas/mes ([checkthat.ai/brands/algolia/pricing](https://checkthat.ai/brands/algolia/pricing), cifra de terceros no oficial) — pero al ser un índice de producción de un retailer real, es mucho más probable que Salcobrand tenga un plan pagado sin ese límite. **No verificable.**
7. **Riesgo:** 🟡 Medio. `docs/operations/RUNBOOK.md` documenta el incidente típico: "Salcobrand desaparece de los resultados — casi siempre `ALGOLIA_APP_ID`/`ALGOLIA_API_KEY` mal configuradas o rotadas sin actualizar Vercel". Al no ser credenciales propias, ComparaFarma no controla su ciclo de vida.
8. **Dependencias:** Impacto parcial — si Algolia/Salcobrand rota las credenciales, Salcobrand desaparece silenciosamente de los resultados de búsqueda (el resto de las 8 farmacias sigue funcionando, `Promise.allSettled` aísla el fallo).
9. **Escalabilidad:** Depende enteramente del plan de Salcobrand, no de ComparaFarma — **No verificable**.
10. **Recomendación:** Mantener el monitoreo activo por farmacia (`monitor-api.yml` ya cubre las 9) como única mitigación real disponible, dado que no hay control directo sobre esta credencial.

### 7. Resend

1. **Nombre:** Resend
2. **Función:** Envío de emails transaccionales — confirmación/disparo de alertas de precio (`api/src/routes/alerts.ts`) y feedback de usuarios (`api/src/routes/feedback.ts`).
3. **Tipo:** Email
4. **Evidencia:** `api/src/lib/email.ts` (llamada REST directa a `https://api.resend.com/emails`, `FROM = "ComparaFarma <onboarding@resend.dev>"` con comentario explícito: "Dominio sandbox de Resend — decisión explícita del CEO (2026-07-31) para no bloquear Sprint C con verificación de dominio propio").
5. **Plan actual:** No verificable con certeza desde el repo, pero el uso del dominio sandbox `resend.dev` (en vez de un dominio propio verificado) es compatible con el tier Free y es una decisión explícita documentada en el propio código, no una limitación técnica forzada.
6. **Limitaciones (plan Free, oficial Resend):** 100 emails/día, 3.000 emails/mes ([resend.com/docs/knowledge-base/account-quotas-and-limits](https://resend.com/docs/knowledge-base/account-quotas-and-limits)). Adicionalmente — hallazgo confirmado en vivo por el CTO en esta sesión — **mientras se use el dominio sandbox, Resend solo entrega de forma confiable al email dueño de la cuenta de Resend, no a cualquier destinatario**. La cuenta de Resend está registrada con un email distinto al usado para pruebas del proyecto (confirmado por el CTO).
7. **Riesgo:** 🔴 Alto. Dos problemas independientes, ambos reales: (a) el límite de 100 emails/día podría alcanzarse con uso real (alertas de precio + feedback + eventuales notificaciones de suscripción); (b) el uso del dominio sandbox significa que **los emails a usuarios reales (confirmación de alerta, notificación de bajada de precio) probablemente no se entregan de forma confiable hoy**, salvo que coincidan con el email dueño de la cuenta de Resend — esto es un riesgo de producto silencioso, no solo de infraestructura: un usuario puede crear una alerta de precio y nunca recibir la confirmación, sin que el sistema reporte error (`sendEmail()` solo loguea el status HTTP, no valida entrega real).
8. **Dependencias:** Impacto parcial en el flujo de alertas de precio (la alerta se crea igual en Supabase, pero el email de confirmación/disparo puede no llegar); sin impacto en búsqueda.
9. **Escalabilidad:** El límite de 100 emails/día es fácilmente alcanzable con cientos de usuarios activos usando alertas de precio simultáneamente — mucho antes de llegar a 10.000 usuarios.
10. **Recomendación:** **Prioridad 1** — verificar un dominio propio en Resend (elimina la restricción de entrega solo al dueño de la cuenta) y evaluar si conviene usar esa misma cuenta/dominio verificado como proveedor SMTP de Supabase Auth (resuelve simultáneamente el hallazgo de Supabase de 2 emails/hora) — pero como señala el propio CTO, esto requiere decisión explícita, no es automático: hoy son dos sistemas de correo separados y la cuenta de Resend está a nombre de un email distinto al de pruebas del proyecto.

### 8. Flow (pagos recurrentes — suscripciones)

1. **Nombre:** Flow (flow.cl)
2. **Función:** Procesador de pagos chileno para el motor de suscripciones (Fase 2, reemplaza a Stripe). Cobra suscripciones periódicas de planes premium (aún sin evidencia de estar comercialmente activo — ver punto 5).
3. **Tipo:** Otros (Payments/Billing)
4. **Evidencia:** `api/src/lib/adapters/flowAdapter.ts` (firma HMAC-SHA256, llamadas a `/subscription/create`, `/customer/register`, `/payment/getStatus`); `api/src/routes/subscriptions.ts` (`handleStartFlowSubscription`, `handleFlowWebhook`); `docs/engineering/adr/ADR-0004_FLOW_SUBSCRIPTION_INTEGRATION.md` ("reemplaza a Stripe... Stripe no admite comercios en Chile").
5. **Plan actual:** **No configurado en producción hoy** — hallazgo directo: el volcado real de variables de entorno de producción (`api/.env.vercel.production`, confirmado por nombres de variable, no valores) **no incluye** `FLOW_API_KEY`, `FLOW_SECRET_KEY` ni `FLOW_API_BASE_URL`, a diferencia de `ALGOLIA_*`/`RESEND_API_KEY`/`SUPABASE_*`/`KHIPU_*` que sí aparecen. El propio código documenta el comportamiento exacto ante esto: `start-flow-subscription` responde `503` explícito; `flow-register-return`/`flow-webhook` responden `200` con `skipped:"flow-not-configured"`.
6. **Limitaciones:** Sandbox (`sandbox.flow.cl`) y producción (`www.flow.cl`) son cuentas separadas con credenciales distintas (`api/.env.example`, comentario explícito) — no hay información pública de límites de tasa/volumen de Flow disponible en esta investigación. **No verificable.**
7. **Riesgo:** 🟢 Bajo operacionalmente (no está activo, no puede fallar en producción), pero 🟡 Medio desde la perspectiva de producto: si existe la expectativa de negocio de que las suscripciones premium ya funcionan, esto es una brecha real entre expectativa y estado técnico — merece confirmación explícita del CTO/producto, no asumirse.
8. **Dependencias:** Sin impacto en el resto del sistema — el código está diseñado explícitamente para degradar (503/200-skipped) sin afectar búsqueda ni otras rutas.
9. **Escalabilidad:** No aplica mientras no esté configurado.
10. **Recomendación:** Confirmar con el CTO si Flow debía estar activo en producción a esta fecha. Si la respuesta es sí, es una **acción inmediata** (configurar las 3 variables en Vercel); si la respuesta es "todavía no", no requiere acción, solo dejar constancia de que el motor de suscripciones vía Flow no está operativo hoy en producción.

### 9. Google Play Console + Google Play Billing (RTDN)

1. **Nombre:** Google Play Console / Google Play Billing
2. **Función:** Distribución de la app Android (`mla.app.comparafarma`) y — para el motor de suscripciones Fase 1 — notificaciones en tiempo real de eventos de suscripción vía Real-Time Developer Notifications (RTDN) sobre Google Cloud Pub/Sub.
3. **Tipo:** Mobile Distribution
4. **Evidencia:** `mobile/app.json` (`package: mla.app.comparafarma`, `versionCode: 31`); `CLAUDE.md` ("aprobado por Google Play para producción el 2026-08-13"); `api/src/lib/adapters/googlePlayAdapter.ts` (parser de RTDN); `api/.env.example` (`GOOGLE_RTDN_SECRET`).
5. **Plan actual:** Cuenta de Google Play Developer estándar (pago único de registro, no un "plan" recurrente). No verificable el estado exacto de la cuenta (individual vs organización) — `docs/release/SERVICE_ACCOUNT_MIGRATION.md` infiere, por el prefijo `mla` del bundle ID, que es una cuenta personal de "Mario Lillo Alfaro".
6. **Limitaciones:** Mismo hallazgo que Flow — **`GOOGLE_RTDN_SECRET` está ausente del volcado real de variables de producción**, lo que implica, según el propio código (`handleGoogleRtdn` en `api/src/routes/subscriptions.ts`, líneas 171–179: "sin fallback abierto... la ruta rechaza todas las solicitudes"), que **el webhook de RTDN de Google Play rechaza (401) toda notificación real hoy**. Además, el propio `googlePlayAdapter.ts` documenta una limitación de diseño de Fase 1 (no un bug): RTDN no trae el `user_id` de Supabase, solo el `purchaseToken`, y sin que `mobile/` (históricamente congelado) envíe ese token al comprar, no hay forma de asociar una notificación nueva a un usuario — solo funcionan renovaciones/cancelaciones de suscripciones ya asociadas manualmente.
7. **Riesgo:** 🟡 Medio — el mismo patrón que Flow: la infraestructura de suscripciones vía Google Play existe en código pero no está verificablemente activa en producción hoy.
8. **Dependencias:** Publicación de `mobile/` en Play Store depende 100% de esta cuenta — es un SPOF real (ver sección dedicada). Sin impacto en búsqueda/backend si el RTDN falla (solo afecta el registro de eventos de suscripción).
9. **Escalabilidad:** No aplica al volumen de búsquedas. Para distribución de la app, Google Play no impone límites de usuarios finales relevantes para este análisis.
10. **Recomendación:** Igual que Flow — confirmar con el CTO si se espera que RTDN esté activo hoy; si sí, configurar `GOOGLE_RTDN_SECRET` en Vercel y el tópico de Pub/Sub en Play Console (procedimiento en `docs/engineering/issues/CF-114_GOOGLE_PLAY_ADAPTER.md`).

### 10. GitHub (repositorio + Actions + Pages)

1. **Nombre:** GitHub
2. **Función:** Repositorio de código fuente (única fuente de verdad, `docs/operations/RUNBOOK.md`: "Código: GitHub es la fuente de verdad; no se requiere backup adicional"), CI/CD (`ci.yml`), monitoreo (`monitor-api.yml`), cron de alertas (`check-price-alerts.yml`), actualización de datos MINSAL (`update-branches.yml`), y hosting de la política de privacidad vía GitHub Pages.
3. **Tipo:** CI-CD / DNS (Pages) / Hosting (Pages)
4. **Evidencia:** remoto real `github.com/Enarhos/appComparaFarma.git`; los 4 workflows en `.github/workflows/`; `CLAUDE.md` (URL de política de privacidad en GitHub Pages).
5. **Plan actual:** No verificable directamente, pero el repo es propiedad de una cuenta personal (`Enarhos`), consistente con el resto de la consolidación de cuentas descrita en `SERVICE_ACCOUNT_MIGRATION.md`. Si es un repo privado en plan Free, aplican los límites de abajo; si es público, minutos de Actions ilimitados.
6. **Limitaciones (oficial GitHub, si el repo fuera privado en plan Free):** 2.000 minutos Linux/mes incluidos ([docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions](https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions)). Windows cuenta 2x, macOS 10x contra esa cuota (no aplica aquí, todos los jobs usan `ubuntu-latest`). Si el repo es público, minutos de runners estándar son gratuitos e ilimitados. **No verificable** si el repo es público o privado desde el contenido inspeccionado.
7. **Riesgo:** 🟢 Bajo para el repo/CI en sí (4 workflows livianos, ejecuciones cortas). 🟡 Medio para GitHub Pages como single point of failure de la URL de política de privacidad registrada en Play Console (ver sección SPOF).
8. **Dependencias:** Servicio inutilizable para deploy/monitoreo/cron si GitHub tiene una caída global (histórico: infrecuente pero ha ocurrido en la industria). Impacto parcial en Play Store si GitHub Pages cae (Google Play no revalida la URL de privacidad en tiempo real tras la aprobación, pero una revisión futura de la app sí podría fallar si la URL no responde).
9. **Escalabilidad:** Los 4 workflows actuales (`ci.yml` en cada push/PR, `monitor-api.yml` cada hora, `check-price-alerts.yml` diario, `update-branches.yml` diario) tienen consumo de minutos predecible y bajo, no escalan con usuarios finales de la app — solo con frecuencia de commits/PRs.
10. **Recomendación:** Confirmar si el repo es privado o público (afecta directamente si hay riesgo real de agotar minutos gratuitos). Sin otras acciones necesarias a corto plazo.

### 11. Expo / EAS

1. **Nombre:** Expo Application Services (EAS)
2. **Función:** Builds cloud del binario Android/iOS y canal de actualizaciones OTA (`expo-updates`) que permite parchear JS/TS sin pasar por revisión de Play Store.
3. **Tipo:** Build / Mobile Distribution
4. **Evidencia:** `mobile/app.json` (`extra.eas.projectId: "4de81d7d-c9ab-470c-be3c-04eb43047e59"`, `owner: "belford"`, `updates.url: "https://u.expo.dev/4de81d7d-c9ab-470c-be3c-04eb43047e59"`); `mobile/eas.json` (perfiles `development`/`preview`/`production`); `CLAUDE.md` ("Build via EAS cloud (requiere cuota mensual free)").
5. **Plan actual:** **Free**, confirmado explícitamente en `CLAUDE.md`: "requiere cuota mensual free" para el build vía EAS cloud — de ahí que el proyecto documente `pnpm build:android` (build local con Android Studio) como "método preferido (sin cuota EAS)".
6. **Limitaciones (Free, oficial Expo):** 30 builds/mes combinados, hasta 15 iOS ([docs.expo.dev/billing/plans](https://docs.expo.dev/billing/plans/), cifra reportada de forma consistente por fuentes 2026); OTA updates limitadas a 1.000 usuarios activos mensuales y 100 GiB de bandwidth de borde ([stalliontech.io/expo-eas-update-pricing](https://stalliontech.io/expo-eas-update-pricing), cifra de terceros, orientativa).
7. **Riesgo:** 🟡 Medio. El límite de 1.000 MAU para OTA es significativamente más bajo que los otros umbrales de esta auditoría (100/1.000/10.000/100.000) — **es probablemente el primer límite de infraestructura que la app cruzará** si tiene éxito de adopción, y afecta directamente la capacidad de "Fix urgente sin nuevo build" que `CLAUDE.md` documenta como el mecanismo preferido para parches rápidos.
8. **Dependencias:** El `projectId` de EAS es un **SPOF crítico** documentado por el propio proyecto (`SERVICE_ACCOUNT_MIGRATION.md`, riesgo 🔴 Alto): cambiarlo rompe el canal OTA para todos los usuarios con la app ya instalada, sin posibilidad de recuperación vía OTA (requiere nuevo build obligatorio en Play Store).
9. **Escalabilidad:** A 100–1.000 usuarios activos, dentro del límite de MAU de OTA. Cruzando 1.000 MAU, las actualizaciones OTA quedan restringidas o requieren upgrade de plan — mucho antes que cualquier otro servicio de este inventario. A 10.000–100.000 usuarios, upgrade de plan Expo obligatorio.
10. **Recomendación:** **Prioridad 1** — este es, con la evidencia disponible, el servicio con el límite más bajo respecto al crecimiento de usuarios esperado. Monitorear el conteo de MAU en el dashboard de EAS y presupuestar el upgrade de plan como parte de cualquier plan de crecimiento, no como reacción a que las actualizaciones OTA dejen de llegar.

### 12. PostHog

1. **Nombre:** PostHog
2. **Función:** Analítica de producto en `mobile/` — captura el evento `medication_search` con query, resultados, farmacias con resultados, mejor precio/farmacia y comuna.
3. **Tipo:** Analytics
4. **Evidencia:** `mobile/package.json` (`posthog-react-native`); `mobile/src/lib/analytics.ts` (`new PostHog("phc_...", { host: "https://us.i.posthog.com" })`, comentario explícito "phc_ keys are write-only client keys — safe to commit").
5. **Plan actual:** No verificable directamente, pero el uso de PostHog Cloud US (`us.i.posthog.com`) sin mención de un plan pagado es compatible con el tier Free.
6. **Limitaciones (Free, oficial PostHog):** 1 millón de eventos de analítica/mes, retención de datos de 1 año, 1 proyecto ([checkthat.ai/brands/posthog/pricing](https://checkthat.ai/brands/posthog/pricing); cifra de terceros consistente entre varias fuentes 2026, no verificada contra la página oficial de pricing de PostHog directamente en esta sesión).
7. **Riesgo:** 🟢 Bajo — analítica, no crítica para funcionalidad. Sin manejo de fallo explícito visible en el código leído, pero el SDK de PostHog está diseñado para fallar de forma no bloqueante (comportamiento estándar del SDK, no verificado línea por línea en este repo).
8. **Dependencias:** Sin impacto funcional si falla — solo se pierde visibilidad de producto/analítica.
9. **Escalabilidad:** 1 millón de eventos/mes es un techo alto — con 1 evento por búsqueda, se necesitarían ~33.000 búsquedas/día sostenidas para agotarlo. Probablemente el último servicio de este inventario en convertirse en un cuello de botella.
10. **Recomendación:** Sin cambios necesarios a corto/mediano plazo.

### 13. MINSAL (Ministerio de Salud de Chile — datos públicos)

1. **Nombre:** MINSAL (dato público del Estado de Chile, no una cuenta de servicio)
2. **Función:** Fuente de datos de sucursales físicas de farmacias por comuna, usada para el índice de sucursales (`api/src/data/branches.json`).
3. **Tipo:** Otros (fuente de datos externa gubernamental)
4. **Evidencia:** `api/src/clients/minsal.ts` (comentario: "MINSAL bloquea IPs de Vercel en runtime"); `.github/workflows/update-branches.yml` (`node scripts-temp/fetch-branches.js`, cron diario 9:00 UTC).
5. **Plan actual:** No aplica (dato público, sin cuenta ni autenticación documentada).
6. **Limitaciones:** MINSAL bloquea activamente las IPs de los data centers de Vercel — por eso el fetch corre exclusivamente desde runners de GitHub Actions y se commitea como archivo estático (`api/src/data/branches.json`/`branches-data.ts`), nunca se consulta en vivo desde `api/`. **No verificable** ningún SLA o límite de tasa formal de la API de MINSAL — es un servicio público sin documentación de límites conocida en esta investigación.
7. **Riesgo:** 🟡 Medio. Es una dependencia externa gubernamental sin SLA, con un bloqueo activo ya conocido contra la infraestructura elegida (Vercel) — si MINSAL cambia su formato de datos o bloquea también los runners de GitHub Actions, el mecanismo de actualización de sucursales se rompe silenciosamente (el workflow seguiría "verde" si el fetch falla de forma no fatal, dependiendo de cómo `fetch-branches.js` maneje errores — **no auditado en detalle en esta sesión**).
8. **Dependencias:** Impacto parcial — los datos de sucursales quedan desactualizados, pero no afecta la búsqueda de precios (funcionalidad core).
9. **Escalabilidad:** No depende de usuarios de ComparaFarma, depende de la disponibilidad de la API pública de MINSAL — no escalable ni controlable por el proyecto.
10. **Recomendación:** Sin cambios necesarios; es un riesgo aceptado y ya mitigado parcialmente (ejecución vía GitHub Actions en vez de Vercel). Verificar periódicamente que el workflow `update-branches.yml` efectivamente está actualizando datos (revisar historial de commits `github-actions[bot]`).

### 14. Las 9 farmacias (fuentes de scraping/API no controladas)

1. **Nombre:** Cruz Verde, Farmacias Ahumada, Salcobrand, Dr. Simi, AraucoMed, EcoFarmacias, Farmex, Sermecoop, EasyFarma (sitios/APIs de terceros, no cuentas de servicio de ComparaFarma).
2. **Función:** Fuente de datos de precios en tiempo real — el propósito central del producto. `api/src/services/searchService.ts` los consulta en paralelo vía `Promise.allSettled`.
3. **Tipo:** Scraping / Otros (dependencias externas no controladas)
4. **Evidencia:** `api/src/clients/{cruzverde,ahumada,salcobrand,drsimi,araucomed,ecofarmacias,farmex,sermecoop,easyfarma}.ts`; `CLAUDE.md` tabla "APIs de Farmacias" (tipo de integración por farmacia); `docs/operations/RUNBOOK.md` §7 "Incidentes frecuentes" (Ahumada y Sermecoop documentados como frágiles).
5. **Plan actual:** No aplica — no son cuentas de ComparaFarma. Ninguna farmacia tiene un acuerdo formal de API documentado en el repo (son integraciones no oficiales/scraping salvo Cruz Verde, Dr. Simi y AraucoMed que usan APIs JSON de sus propias plataformas de comercio, no necesariamente con permiso explícito documentado).
6. **Limitaciones:** No hay SLA de ninguna de las 9 farmacias. Riesgos específicos ya documentados por el propio proyecto: Ahumada usa regex sobre HTML de Demandware ("puede fallar silenciosamente" — `CLAUDE.md`); Sermecoop usa flujo GET→POST con PHPSESSID+CSRF, "propenso a exceder el timeout de 30s de las funciones de Vercel" (`RUNBOOK.md`).
7. **Riesgo:** 🔴 Alto (Ahumada, Sermecoop) / 🟡 Medio (el resto). Es la categoría de mayor fragilidad estructural del producto: 6 de 9 integraciones dependen de HTML scraping o de infraestructura de terceros que puede cambiar sin aviso, sin contrato ni versión de API estable.
8. **Dependencias:** Impacto parcial por diseño — `Promise.allSettled` aísla el fallo de una farmacia del resto (`CLAUDE.md`, diagrama de arquitectura). El monitor horario (`monitor-api.yml`) ya distingue severidad (1-2 farmacias caídas = warning, 3+ = critical).
9. **Escalabilidad:** No escalan con usuarios de ComparaFarma — escalan (o se rompen) según cambios unilaterales de cada farmacia. A mayor tráfico de ComparaFarma hacia sus sitios, aumenta el riesgo de ser detectado y bloqueado como scraper (especialmente Ahumada/Sermecoop), un riesgo que crece con el éxito del producto, no lineal con la infraestructura propia.
10. **Recomendación:** Mantener el monitoreo horario ya implementado. Evaluar (decisión de producto/legal, no solo técnica) si conviene formalizar acuerdos de datos con alguna farmacia a medida que el tráfico crezca, reduciendo el riesgo de bloqueo.

### 15. Android Studio + build local (`pnpm build:android`)

1. **Nombre:** Android Studio (herramienta local) + script `scripts-temp/build-android-release.ps1`
2. **Función:** Alternativa al build cloud de EAS para generar el AAB de producción sin consumir cuota de EAS.
3. **Tipo:** Build
4. **Evidencia:** `package.json` raíz (`"build:android": "pwsh scripts-temp/build-android-release.ps1"`); `CLAUDE.md`: "Build de producción Android AAB — método preferido (sin cuota EAS)... Requiere: Android Studio instalado; `EXPO_NO_METRO_WORKSPACE_ROOT=1`".
5. **Plan actual:** No aplica (herramienta local, no un servicio cloud con plan).
6. **Limitaciones:** Depende de una máquina local específica con Android Studio y el SDK de Android instalados y actualizados — no hay evidencia de un entorno reproducible (ej. contenedor Docker) que garantice que cualquier persona del equipo pueda ejecutar este build sin configurar su máquina desde cero.
7. **Riesgo:** 🟡 Medio — es un **SPOF de conocimiento/entorno**, no de cuenta: si solo una persona tiene su máquina configurada para correr `pnpm build:android`, esa persona es un cuello de botella para publicar actualizaciones que requieran build nativo (a diferencia de `eas update`, que sí es cloud).
8. **Dependencias:** Impacto parcial — el flujo alternativo (`eas update --branch production`) sigue disponible para fixes de solo JS/TS sin necesitar este build local, según documenta `CLAUDE.md` explícitamente.
9. **Escalabilidad:** No aplica a usuarios finales — aplica a la capacidad del equipo de publicar releases.
10. **Recomendación:** Documentar (si no existe ya) el procedimiento exacto de configuración de una máquina nueva para este build, y considerar si más de una persona debería poder ejecutarlo, dado que ya es el "método preferido".

### 16. Keystore de firma Android (`release.keystore`)

> **Reclasificación (2026-08-15, sprint de cierre operacional):** el CTO verificó manualmente en Google Play Console que **Google Play App Signing está habilitado** para `mla.app.comparafarma` (certificado de clave de firma de la app, certificado de clave de subida, fingerprints MD5/SHA-1/SHA-256 y mecanismo de reset de upload key, todos confirmados presentes). Con esto, la pérdida del `release.keystore` local **deja de ser una pérdida irreversible de la capacidad de publicar** — es la clave de *subida* (upload key), no la clave definitiva de firma (que Google custodia y usa para re-firmar el AAB). Si se pierde, Google Play ofrece un mecanismo de reset de upload key para recuperar la capacidad de publicar. El texto original de esta ficha (puntos 2, 4, 6, 8, 10 abajo) describía el escenario **sin** Play App Signing habilitado — se conserva sin editar por trazabilidad histórica; la clasificación vigente es la de este recuadro, no la del texto original. Ver detalle en `docs/operations/PLATFORM_OPERATIONAL_STATUS.md`.

1. **Nombre:** Keystore de firma de la app Android (`release.keystore`)
2. **Función:** Clave criptográfica requerida por Google Play para firmar cada actualización de `mla.app.comparafarma`. *(Texto original, previo a la reclasificación de arriba)* Sin ella, no se puede publicar ninguna actualización futura de la app (salvo reset de upload key vía Play App Signing) — con Play App Signing ya confirmado habilitado, el reset de upload key **es** el camino real disponible, no una salvedad hipotética.
3. **Tipo:** Certificados
4. **Evidencia:** `docs/operations/RUNBOOK.md` §5 ("Firma de Android (`release.keystore`): no expira en la práctica (validez hasta 2053)... Si se pierde el keystore, no hay recuperación") y §8 ("existen copias de `release.keystore` en `mobile/`... estas copias deben respaldarse fuera del repo... el archivo está en `.gitignore`, no se sube a GitHub"). **Actualización 2026-08-15:** Play App Signing confirmado habilitado por el CTO en Play Console — la afirmación "no hay recuperación" de `RUNBOOK.md` §5 queda desactualizada para el escenario real actual (pendiente de corrección en esa misma sección).
5. **Plan actual:** No aplica.
6. **Limitaciones:** Ya no es un riesgo de "todo o nada". Con Play App Signing habilitado, el riesgo real es de **continuidad operacional** (fricción y tiempo de ejecutar un reset de upload key en Play Console si se pierde el archivo local), no de imposibilidad permanente de publicar. Sigue siendo recomendable mantener un backup del `release.keystore`/upload key fuera del repo para evitar esa fricción, pero ya no es la única vía de recuperación.
7. **Riesgo:** 🔴 Alto. `RUNBOOK.md` lo declara sin rodeos: "sin él, no se puede publicar ninguna actualización futura de la app" (salvo el mecanismo de recuperación de Google Play App Signing, cuya disponibilidad para este proyecto no está confirmada en el repo — **No verificable**).
8. **Dependencias:** *(Texto original)* Servicio inutilizable (publicación de actualizaciones de `mobile/`) si se pierde el archivo y no existe backup fuera del repo ni Play App Signing habilitado — **Play App Signing ya está confirmado habilitado (2026-08-15)**, por lo que este escenario de "servicio inutilizable" ya no aplica; ver recuadro de reclasificación arriba.
9. **Escalabilidad:** No aplica — ya no es un riesgo binario (con Play App Signing, hay un camino de recuperación vía reset de upload key), independiente del número de usuarios.
10. **Recomendación:** Confirmar (acción humana, no de código) que existe al menos una copia cifrada del keystore/upload key en un gestor de contraseñas o vault separado — reduce fricción operacional si se pierde el archivo local, aunque ya no es la única vía de recuperación. Sin evidencia de que este backup exista hoy: `HUMAN_ACTION_REQUIRED: BACKUP_ANDROID_UPLOAD_KEY` (ver `docs/operations/PLATFORM_OPERATIONAL_STATUS.md`). Baja de Prioridad 1 a Prioridad 2 tras la reclasificación de 2026-08-15.

---

## Arquitectura Operacional

### Flujo real: búsqueda de un medicamento (mobile o web)

```
Usuario (mobile/Expo o web/Next.js)
  │
  │ GET https://comparafarma-api.vercel.app/api/search?q=paracetamol
  ▼
Vercel — proyecto comparafarma-api (Hobby, single region iad1 por defecto)
  │
  ├─► Upstash Redis: getCachedSearch() ── HIT ──► responde con caché (TTL 5 min default)
  │        │ MISS
  │        ▼
  ├─► Supabase app_config: getDisabledPharmacies() (fallback: env var DISABLED_PHARMACIES)
  │
  ├─► Promise.allSettled([
  │       Cruz Verde   (API JSON Demandware)
  │       Salcobrand   (Algolia — credenciales de Salcobrand, no propias)
  │       Ahumada      (scraping HTML Demandware — frágil)
  │       Dr. Simi     (API JSON VTEX)
  │       AraucoMed    (API JSON PrestaShop)
  │       EcoFarmacias (API WooCommerce)
  │       Farmex       (API Shopify Predictive Search)
  │       Sermecoop    (scraping HTML PHP — frágil, riesgo de timeout 30s)
  │       EasyFarma    (scraping HTML WordPress)
  │    ])
  │
  ├─► @comparafarma/domain: mergeDuplicates() (matchKey = activo|dosis|cantidad)
  │
  ├─► Upstash Redis: setCachedSearch() (bloqueante en el camino caliente — Alto #4 de RC-03, no resuelto)
  ├─► Supabase price_history: recordPriceHistory() (bloqueante, mismo hallazgo)
  ├─► PostHog (solo mobile, cliente): captureSearch()
  │
  ▼
Respuesta JSON → mobile/web renderiza resultados
```

### Flujo real: identidad (login / recuperar contraseña)

```
mobile/ (@supabase/supabase-js + expo-secure-store)  o  web/ (@supabase/ssr)
  │
  ▼
Supabase Auth (proyecto único, plan Free)
  │
  ├─► Login con password existente: sin límite de email, funciona siempre que Supabase esté up.
  │
  └─► Registro / Recuperar contraseña (requiere email):
         │
         ▼
      Servicio de email integrado de Supabase — 2 emails/hora, TODO el proyecto
         │
         └─► si se excede: el email no se envía (o se retrasa), Supabase no tiene
             SMTP propio conectado hoy — Resend existe en el proyecto pero para
             OTRO propósito (alertas/feedback vía api.resend.com directo, no
             conectado como proveedor SMTP de Supabase Auth)
```

### Flujo real: alerta de precio por email

```
web/ (sin cuenta de usuario) → POST /api/alerts (api/)
  │
  ├─► rate limit (Upstash/memoria): 5 intentos/hora por IP
  ├─► Supabase: createAlert() (tabla email_alerts, inferida — no confirmada en schema.sql leído)
  └─► Resend API (api.resend.com) — FROM: onboarding@resend.dev (dominio sandbox)
         │
         └─► Entrega NO garantizada a menos que el destinatario coincida con el
             email dueño de la cuenta de Resend (hallazgo confirmado por el CTO)

GitHub Actions (check-price-alerts.yml, cron diario 12:00 UTC)
  │
  └─► GET /api/alerts?action=check&secret=CRON_SECRET (api/)
         │
         ├─► searchMedications() por cada medicamento con alerta activa
         └─► Resend API — mismo riesgo de entrega que arriba
```

### Flujo real: suscripción premium (Fase 1/2 — estado parcialmente no confirmado en producción)

```
web/ "Cuenta" → POST /api/subscriptions?action=start-flow-subscription
  │
  ├─► si FLOW_API_KEY/SECRET/BASE_URL ausentes en Vercel (evidencia: no aparecen
  │    en el volcado real de env vars de producción) → 503 explícito, sin crash
  │
  └─► (si estuviera configurado) Flow API (sandbox.flow.cl o www.flow.cl)
         │
         └─► webhook Flow → POST /api/subscriptions?action=flow-webhook
                → resuelve token vía GET firmado → Supabase subscriptions/subscription_events

mobile/ (Google Play Billing) → Google Cloud Pub/Sub (RTDN)
  │
  └─► POST /api/subscriptions?action=google-rtdn&token=GOOGLE_RTDN_SECRET
         │
         └─► si GOOGLE_RTDN_SECRET ausente en Vercel (mismo hallazgo que Flow) → 401,
             ninguna notificación real de Google Play se procesa hoy
```

---

## Single Points of Failure

| # | SPOF | Riesgo | Impacto | Mitigación recomendada |
|---|---|---|---|---|
| 1 | **Cuenta personal única (`mario.lillo.alfaro@gmail.com`)** concentra o es destino de consolidación de Vercel, Expo/EAS, Google Play, GitHub, Sentry, PostHog, Upstash, Khipu, Resend (evidencia: `docs/release/SERVICE_ACCOUNT_MIGRATION.md`, `web/.env.example` → `ADMIN_ALLOWED_EMAILS=mario.lillo.alfaro@gmail.com`) | 🔴 Alto | Si esa cuenta personal se pierde/compromete/bloquea (ej. Google suspende la cuenta de Gmail asociada), prácticamente toda la infraestructura queda inaccesible simultáneamente — no es un riesgo por servicio individual, es un riesgo sistémico correlacionado. | Evaluar la creación de cuentas de organización (Google Workspace, GitHub Organization, Vercel Team bajo dominio propio) en vez de una cuenta Gmail personal para los servicios de mayor criticidad (Vercel, GitHub, Supabase). Documentado ya como pendiente en el propio `SERVICE_ACCOUNT_MIGRATION.md`. |
| 2 | **Proyecto Supabase único** para `api/`+`web/`+`mobile/` (misma URL confirmada en `web/.env.example`, `mobile/.env.local.example`, `docs/architecture/IDENTITY_INTEGRATION_PLAN.md` explícitamente prohíbe crear uno nuevo) | 🔴 Alto | Historial de precios, config, feedback, suscripciones, y toda la identidad de usuario (login/registro/recuperación) dependen de un único proyecto Postgres/Auth. Una pausa por inactividad (plan Free) o una caída afecta a los tres frontends simultáneamente. | Evaluar upgrade a plan Pro de Supabase antes de depender de Auth para flujos críticos de producto (no solo por límites de recursos, también evita la pausa automática por inactividad del plan Free). |
| 3 | **Un solo dominio de deploy por proyecto Vercel** (`comparafarma-api.vercel.app`, `app-compara-farma-web.vercel.app`), hardcodeado como fallback en múltiples lugares (`mobile/.env.local.example`, `api/.env.example` → `WEB_APP_URL`/`API_PUBLIC_URL`) | 🟡 Medio | Cambiar de dominio (ej. mover a un dominio propio) requiere actualizar múltiples env vars coordinadas entre 3 proyectos y potencialmente un nuevo build de `mobile/` si el cambio no es vía OTA. | Mantener una lista centralizada de dónde vive cada URL hardcodeada (ya existe parcialmente en `docs/operations/ENVIRONMENT.md`) antes de cualquier migración de dominio. |
| 4 | **`projectId` único de Expo/EAS** (`4de81d7d-c9ab-470c-be3c-04eb43047e59`) | 🔴 Alto | Cambiarlo rompe el canal OTA para todos los usuarios con la app instalada (ya documentado explícitamente como riesgo Alto en `SERVICE_ACCOUNT_MIGRATION.md`). | No migrar de cuenta Expo una vez que haya usuarios reales en producción sin un plan de comunicación de "actualiza manualmente desde Play Store". |
| 5 | **Keystore de firma Android** sin backup confirmado fuera del repo | 🟡 Medio (reclasificado 2026-08-15 — antes 🔴 Alto) | Play App Signing confirmado habilitado (Play Console, verificado por el CTO 2026-08-15) — la pérdida del archivo local ya no impide publicar (reset de upload key disponible), pero sigue generando fricción/tiempo operacional sin un backup confirmado (ver ficha #16). | `HUMAN_ACTION_REQUIRED: BACKUP_ANDROID_UPLOAD_KEY` — confirmar backup cifrado fuera del repo (acción humana pendiente). |
| 6 | **Un solo dominio GitHub Pages** para la política de privacidad, registrado en Google Play Console (`enarhos.github.io/appComparaFarma/privacy-policy.html`) | 🟡 Medio | Si el repo se transfiere de owner (`Enarhos` → otra cuenta) sin actualizar Play Console, la URL de privacidad puede quedar rota, arriesgando el cumplimiento de políticas de Play Store en una futura revisión. | Actualizar Play Console en el mismo cambio que cualquier transferencia de repo (ya documentado como paso explícito en `SERVICE_ACCOUNT_MIGRATION.md` §4). |
| 7 | **`CRON_SECRET`/`GOOGLE_RTDN_SECRET`/`API_SECRET_KEY` como secretos compartidos únicos**, sin mecanismo de rotación automatizada | 🟡 Medio | Una fuga de cualquiera de estos secretos (ej. expuesto en un log) requiere rotación manual coordinada en Vercel + GitHub Secrets + Play Console (para RTDN), documentado en `RUNBOOK.md` §4 pero como procedimiento manual, no automatizado. | Mantener el procedimiento de rotación de `RUNBOOK.md` §4 actualizado y probado; considerar rotación periódica programada, no solo reactiva. |
| 8 | **Webhook de Flow y RTDN de Google sin verificación de que están realmente activos en producción** (ver fichas #8 y #9) | 🟡 Medio | Si el negocio asume que las suscripciones premium generan ingresos hoy, esa asunción sería incorrecta según la evidencia de variables de entorno ausentes en producción. | Confirmación explícita del CTO — no es un problema de infraestructura per se, es un riesgo de expectativa de negocio vs. estado técnico real. |
| 9 | **Cron jobs de GitHub Actions sin alertas si el propio cron falla en dispararse** (a diferencia de si el endpoint responde error, que sí genera issue vía `monitor-api.yml`) | 🟡 Medio | `check-price-alerts.yml` y `update-branches.yml` no tienen el mismo mecanismo de creación de issue en caso de fallo que `monitor-api.yml` sí implementa. Un fallo silencioso de estos crons (ej. GitHub Actions no dispara el schedule por mantenimiento de GitHub) no generaría ninguna alerta. | Replicar el patrón de creación de issue en fallo (`monitor-api.yml`) en `check-price-alerts.yml` y `update-branches.yml`. |
| 10 | **Una sola persona con acceso operacional real** | No verificable | No verificable desde el repositorio quién, además del CTO/desarrollador principal, tiene acceso operativo a Vercel/Supabase/GitHub/Play Console hoy — no hay evidencia de un segundo administrador documentado en ningún archivo revisado. | Confirmar explícitamente (fuera de este repo) si existe una persona de respaldo con acceso a los servicios críticos. |

---

## Seguridad Operacional

| Área | Evaluación | Evidencia |
|---|---|---|
| Gestión de secretos | Todos los secretos viven en variables de entorno de Vercel (por proyecto) y GitHub Secrets — no se encontró ningún secreto committeado en texto plano en los archivos `.env.example`/`.env.local.example` inspeccionados (todos vacíos o con placeholders). | `api/.env.example`, `mobile/.env.local.example`, `web/.env.example` — todos con valores vacíos o placeholders explícitos (`xxxxx`). |
| Variables de entorno | Documentadas exhaustivamente y con "impacto si falta" explícito para cada una en `docs/operations/ENVIRONMENT.md` — nivel de documentación notablemente alto comparado con proyectos similares. | `docs/operations/ENVIRONMENT.md` completo. |
| Fail-open vs. fail-closed | `API_SECRET_KEY` es explícitamente **fail-open** (si no está configurada, `/api/search` queda sin autenticación) — riesgo conocido y documentado, no un descuido. `CRON_SECRET`/`GOOGLE_RTDN_SECRET` son fail-closed por diseño (correcto). | `api/src/middleware/auth.ts`, `docs/operations/ENVIRONMENT.md` sección "Variables de mayor riesgo operacional". |
| Backups | Supabase: backups automáticos diarios gestionados por el proveedor (plan de retención "no verificable" desde el repo, depende de si es Free o Pro). Código: GitHub. Secrets: sin backup fuera de los dashboards de cada proveedor (documentado explícitamente como aceptado — "el procedimiento es regenerar, no restaurar"). Keystore: sin backup confirmado fuera del repo (ver SPOF #5). | `docs/operations/RUNBOOK.md` §8. |
| Restauración | Documentada para DB (Supabase Dashboard → Restore) y para código (rollback de deploy Vercel). Sin backup automatizado de env vars — mitigación es mantener `ENVIRONMENT.md` actualizado. | `docs/operations/RUNBOOK.md` §9. |
| Logging | Existe una capa de saneamiento (`api/src/lib/logger.ts`, creada en sprint RC-03) que redacta emails y tokens largos antes de loguear — aplicada en 13 archivos según `docs/release/RC-03_PRODUCTION_READINESS_REPORT.md`. | `docs/release/RC-03_PRODUCTION_READINESS_REPORT.md` sección "Cambios implementados → Logging". |
| Monitoreo/Observabilidad | Monitor horario de 9 farmacias + `/api/health` (`monitor-api.yml`), Sentry condicional en ambos frontends de código (api/mobile), pero — **hallazgo verificado en esta auditoría** — el `/api/health` real en el código (`api/src/routes/health.ts`) solo devuelve `{ ok, service, timestamp }`, **sin** los campos `environment`, `commit`, `uptimeSeconds`, `memoryMb`, `dependencies.{redis,supabase,algolia}` que `docs/operations/RUNBOOK.md` (§6) y `docs/release/RC-03_PRODUCTION_READINESS_REPORT.md` (sección "Health Check") afirman que fueron implementados. Esto es una discrepancia real entre documentación y código verificada línea por línea en esta sesión, no una suposición — o bien el cambio se revirtió después de RC-03, o el deploy actual no lo refleja. **Tiene impacto operacional directo**: el RUNBOOK usa `/api/health` → `dependencies.supabase`/`dependencies.redis` como paso de diagnóstico en su tabla de incidentes (§3), un procedimiento que no puede ejecutarse tal como está escrito hoy. | `api/src/routes/health.ts` (contenido completo leído, 11 líneas), comparado con `docs/operations/RUNBOOK.md` §6 y `docs/release/RC-03_PRODUCTION_READINESS_REPORT.md`. |
| Rotación de credenciales | Procedimiento documentado explícitamente por variable (`RUNBOOK.md` §4), pero es manual — sin evidencia de rotación periódica programada, solo reactiva ante sospecha de fuga. | `docs/operations/RUNBOOK.md` §4. |
| Continuidad operacional | Documentada en `RUNBOOK.md`/`ENVIRONMENT.md` con un nivel de detalle alto (recuperación ante fallos, tabla síntoma→causa→acción). | `docs/operations/RUNBOOK.md` §3. |
| Cuentas propietarias | Ver sección Single Points of Failure #1 — concentración documentada y reconocida por el propio proyecto, no un hallazgo nuevo de esta auditoría, pero sí uno que sigue sin resolverse según la evidencia (`ADMIN_ALLOWED_EMAILS` sigue siendo un único email). | `docs/release/SERVICE_ACCOUNT_MIGRATION.md`, `web/.env.example`. |
| Control de accesos | `/admin` (web) gateado por Google OAuth + allowlist de un solo email (`ADMIN_ALLOWED_EMAILS`); rutas administrativas de `api/` (`grant-manual`/`revoke-manual`) gateadas por `API_SECRET_KEY` (fail-open si no está configurada — ver arriba). **No verificable** el control de acceso a los dashboards de los proveedores externos (Vercel/Supabase/GitHub) más allá de lo ya cubierto en Single Points of Failure. | `web/.env.example`, `api/src/routes/subscriptions.ts` (`isAuthorized`). |
| Higiene del repositorio | Carpetas de trabajo temporal presentes en la raíz del repo (`audit-package/`, `tmp-spike-001/`, `tmp-task-004/`, `ml_borrar/`, `_CLAUDE_TMP_BORRAR/`) — no representan un riesgo de seguridad directo detectado, pero sí un riesgo de gobernanza/claridad operacional si contienen código o datos que alguien asuma erróneamente que están en desuso o viceversa. **Corrección 2026-08-13:** `scripts-temp/` fue retirada de este listado — es infraestructura operativa real (invocada por `update-branches.yml` y por `pnpm build:android`), no una carpeta de limpieza; el error original de clasificación se detectó y corrigió antes de ejecutar ninguna limpieza (ver Nota de higiene al inicio del documento). | Listado de directorios de la raíz del repo; `.github/workflows/update-branches.yml`; `package.json` raíz. |

---

## Costos Futuros

| Servicio | Plan actual | Próximo límite | Riesgo | Recomendación |
|---|---|---|---|---|
| Vercel (`comparafarma-api`) | Hobby (confirmado, PM-001) | 12 funciones serverless por deployment (hoy ~10 entrypoints reales) | 🟡 Medio | Consolidar rutas nuevas dentro de los entrypoints existentes (patrón `action=` ya usado en `alerts.ts`/`subscriptions.ts`) antes de agregar archivos nuevos en `api/api/`. |
| Vercel (`comparafarma-web`) | No verificable | No verificable | No verificable | Confirmar plan real antes de proyectar. |
| Supabase | Free (confirmado en vivo por el CTO) | 2 emails/hora (servicio de email integrado); pausa por inactividad tras 1 semana sin requests (cifra de terceros, no confirmada oficialmente) | 🔴 Alto | Migrar a SMTP propio (Resend con dominio verificado u otro proveedor) antes de escalar onboarding de usuarios. |
| Upstash Redis | No verificable (probable Free) | 500.000 comandos/mes | 🟡 Medio | Monitorear consumo real en el dashboard de Upstash. |
| Sentry (api + mobile) | No verificable (probable Free) | 5.000 errores/mes por proyecto (cifra de terceros) | 🟢 Bajo | Revisar dashboard periódicamente por Spike Protection activo. |
| Resend | No verificable (probable Free) | 100 emails/día, 3.000/mes; entrega no confiable a terceros mientras use dominio sandbox | 🔴 Alto | Verificar dominio propio — acción de Prioridad 1. |
| Algolia (cuenta de Salcobrand) | No verificable, no es cuenta propia | No verificable — depende de Salcobrand | 🟡 Medio | Ninguna acción posible directamente; mantener monitoreo. |
| Expo/EAS | Free (confirmado en `CLAUDE.md`) | 30 builds/mes; **1.000 MAU para OTA updates** (cifra de terceros, pero es el límite más bajo del inventario) | 🔴 Alto | Presupuestar upgrade de plan Expo como parte de cualquier plan de crecimiento de usuarios — antes de los 1.000 usuarios activos, no después. |
| PostHog | No verificable (probable Free) | 1.000.000 eventos/mes | 🟢 Bajo | Sin acción necesaria a corto plazo. |
| Khipu | Cuenta activa (comisión ~0,69%+IVA por transacción, no un "plan" con límite de volumen) | No aplica límite de plan — costo variable por transacción | 🟢 Bajo | Sin acción necesaria; el costo escala proporcionalmente con el volumen de donaciones, no representa un riesgo de "límite" sino de comisión variable. |
| Flow | No configurado en producción (ver ficha #8) | No aplica mientras no esté activo | 🟡 Medio (de producto, no de infraestructura) | Confirmar con el CTO el estado esperado. |
| Google Play Billing/RTDN | No configurado en producción (ver ficha #9) | No aplica mientras no esté activo | 🟡 Medio (de producto, no de infraestructura) | Confirmar con el CTO el estado esperado. |
| GitHub Actions | No verificable (público vs. privado) | 2.000 minutos/mes si es privado en plan Free | 🟢 Bajo | Confirmar visibilidad del repo. |

---

## Matriz de Riesgos Consolidada

### Críticos (requieren decisión/acción antes de escalar usuarios)
1. **Supabase Auth — 2 emails/hora en todo el proyecto.** Bloquea recuperación de contraseña y confirmación de registro a partir de un uso simultáneo mínimo. Confirmado en vivo por el CTO.
2. **Resend con dominio sandbox — entrega no confiable a destinatarios reales.** Las alertas de precio y emails de feedback pueden no llegar a usuarios reales silenciosamente. Confirmado en vivo por el CTO.
3. **Keystore de firma Android sin backup confirmado fuera del repo.** *(Reclasificado 2026-08-15 de Crítico a Medio — ver ficha #16 y SPOF #5: Play App Signing confirmado habilitado, ya no es un riesgo binario de pérdida total, sino de fricción/continuidad operacional.)*
4. **Concentración de infraestructura crítica en una sola cuenta personal.** Riesgo sistémico correlacionado sobre Vercel, GitHub, Expo/EAS, Supabase (indirectamente), Sentry, PostHog, Upstash, Khipu, Resend.

### Altos
5. **`/api/health` no refleja lo que la documentación operacional (`RUNBOOK.md`, RC-03) afirma que implementa** — el procedimiento de diagnóstico documentado no es ejecutable tal cual hoy.
6. **Límite de 1.000 MAU de Expo/EAS para OTA updates** — probablemente el primer límite de infraestructura que la app cruzará con crecimiento real.
7. **`projectId` único de Expo/EAS** — SPOF ya reconocido por el propio proyecto.
8. **Fragilidad estructural de scraping en Ahumada y Sermecoop** — 2 de 9 farmacias con integraciones frágiles y ya documentadas como propensas a falla.
9. **Estado no verificado en producción de Flow y Google Play RTDN** — riesgo de que el negocio asuma monetización activa que no está confirmada técnicamente.

### Medios
10. Vercel Hobby cerca del límite de 12 funciones serverless en `comparafarma-api`.
11. `web/` se despliega sin gate real de CI (el job `web-build` es informativo, no bloqueante).
12. Cron jobs (`check-price-alerts.yml`, `update-branches.yml`) sin alerta si el propio cron falla en dispararse.
13. `API_SECRET_KEY` fail-open — riesgo conocido y aceptado, pero sigue siendo una superficie real si se olvida configurar en un entorno nuevo.
14. Dependencia de Algolia con credenciales que pertenecen a Salcobrand, no a ComparaFarma.
15. GitHub Pages como único host de la política de privacidad registrada en Play Console.

### Bajos
16. Sentry / PostHog / Upstash con límites de plan Free holgados para el volumen actual esperado.
17. Carpetas de trabajo temporal en la raíz del repo (higiene, no seguridad).
18. Ausencia de smoke test bloqueante en el deploy de `web/` (mitigado parcialmente por ser solo contenido/SEO, no el core de búsqueda).

---

## Roadmap de Infraestructura

### Prioridad 1 — antes de escalar usuarios significativamente
- Configurar SMTP propio para Supabase Auth (resuelve el límite de 2 emails/hora).
- Verificar un dominio propio en Resend (resuelve la entrega no confiable con el dominio sandbox) — evaluar si conviene que sea el mismo dominio usado para el punto anterior.
- Confirmar que existe un backup cifrado del `release.keystore` fuera del repositorio.
- Confirmar con el CTO el estado real esperado de Flow y Google Play RTDN en producción (activar configurando las variables, o documentar explícitamente que están en pausa deliberada).
- Corregir la discrepancia de `/api/health` — o restaurar los campos que `RUNBOOK.md`/RC-03 documentan, o corregir la documentación para que refleje el código real (cualquiera de las dos, pero no dejar la discrepancia).

### Prioridad 2 — próximos meses
- Evaluar migrar las cuentas de infraestructura crítica (Vercel, GitHub, Supabase) de una cuenta personal a cuentas de organización, reduciendo el riesgo sistémico correlacionado.
- Monitorear proactivamente el conteo de MAU de Expo/EAS y presupuestar el upgrade de plan antes de cruzar 1.000 usuarios activos.
- Agregar el mismo mecanismo de alerta-por-issue de `monitor-api.yml` a `check-price-alerts.yml` y `update-branches.yml`.
- Agregar un gate bloqueante real entre `web-build` (CI) y el deploy automático de Vercel para `web/`.
- Revisar el plan real de Vercel para `comparafarma-web` y confirmar si conviene o no compartir team/plan con `comparafarma-api`.

### Prioridad 3 — puede esperar
- Evaluar consolidar `email.ts`/`feedback.ts` (duplicación ya señalada en RC-03, sin urgencia operacional).
- Definir un entorno reproducible (ej. contenedor) para el build local de Android, reduciendo la dependencia de una máquina específica configurada manualmente.
- Formalizar acuerdos de datos con farmacias de mayor fragilidad de scraping (Ahumada, Sermecoop) si el tráfico crece lo suficiente como para justificar el esfuerzo legal/comercial.
- Limpiar del repo las carpetas de trabajo temporal identificadas en la nota de higiene al inicio de este documento.

---

## Conclusión Ejecutiva

**1. ¿Podemos operar con tranquilidad utilizando la infraestructura actual?**
🟡 **Sí, con observaciones.** El sistema tiene una base operacional inusualmente bien documentada para su tamaño (`RUNBOOK.md`, `ENVIRONMENT.md`, postmortems, ADRs) y ningún hallazgo de esta auditoría indica una caída inminente del servicio de búsqueda (el flujo core, con 9 farmacias en paralelo y degradación aislada por diseño, es sólido). Pero hay dos riesgos concretos y ya en producción hoy — el límite de email de Supabase Auth y la entrega no confiable de Resend con dominio sandbox — que afectan funcionalidad real de usuarios (recuperar contraseña, recibir una alerta de precio) de forma silenciosa, sin que el sistema reporte error visible. Operar "con tranquilidad" sin resolver esos dos puntos sería subestimar un riesgo ya confirmado, no hipotético.

**2. ¿Cuál es hoy el mayor riesgo operacional de ComparaFarma?**
La concentración de prácticamente toda la infraestructura crítica (Vercel, GitHub, Expo/EAS, y por extensión el control administrativo de Supabase) en una única cuenta personal, combinada con dos fallas de entrega de email ya activas en producción (Supabase Auth y Resend) que afectan directamente a usuarios reales sin generar ninguna alerta visible en el sistema de monitoreo actual.

**3. ¿Cuál será probablemente el primer servicio que obligará a migrar de plan?**
**Expo/EAS**, específicamamente el límite de 1.000 usuarios activos mensuales para actualizaciones OTA — es, con la evidencia recogida, el umbral más bajo de todo el inventario frente al crecimiento esperado de usuarios, por debajo incluso de los límites de Vercel/Supabase/Upstash a ese mismo volumen.

**4. ¿Cuál es el orden recomendado para invertir en infraestructura?**
(1) Email transaccional confiable (Supabase SMTP + dominio Resend verificado) — es lo único que hoy afecta silenciosamente a usuarios reales. (2) Custodia del keystore de firma Android — riesgo binario e irreversible si se materializa. (3) Reducir la concentración de cuentas personales en los servicios de mayor criticidad. (4) Presupuestar el upgrade de Expo/EAS antes de cruzar 1.000 usuarios activos. (5) Resolver la discrepancia de `/api/health` para que el runbook de incidentes sea ejecutable tal como está escrito.

**5. ¿Qué acciones recomienda ejecutar inmediatamente antes de comenzar a escalar usuarios?**
- Configurar SMTP propio para Supabase Auth y verificar un dominio propio en Resend.
- Confirmar la existencia de un backup seguro del `release.keystore` fuera del repositorio.
- Obtener del CTO una respuesta explícita sobre si Flow y Google Play RTDN deben estar activos hoy en producción.
- Corregir la discrepancia entre `/api/health` (código real) y `RUNBOOK.md`/RC-03 (documentación), para que el procedimiento de diagnóstico de incidentes sea confiable.
- Empezar a monitorear el MAU de Expo/EAS desde ya, no cuando se acerque al límite.
