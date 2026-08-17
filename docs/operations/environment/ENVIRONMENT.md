# Variables de Entorno — ComparaFarma

**Sprint:** RC-03 — Production Readiness: Observability & Operations
**Fecha:** 2026-08-06
**Alcance:** `api/` y `web/`. `mobile/` no usa variables de entorno de servidor — solo `EXPO_PUBLIC_API_URL`/`EXPO_PUBLIC_API_KEY` en `mobile/.env.local` (no trackeado por git), documentadas en `mobile/.env.local.example`.

Este documento es la fuente de verdad operacional sobre qué variables existen, qué pasa si faltan, y dónde configurarlas (Vercel → Project Settings → Environment Variables, por proyecto: `comparafarma-api` y `comparafarma-web`).

> **Trazabilidad (2026-08-13):** para el inventario de servicios (a qué servicio pertenece cada grupo de variables, criticidad, propietario), ver `docs/operations/PLATFORM_SERVICE_CATALOG.md` (OPS-SVC-001) — este documento sigue siendo la única fuente del detalle por variable.

---

## Backend (`api/`)

| Variable | Descripción | Obligatoria | Default | Entorno | Impacto si falta |
|---|---|---|---|---|---|
| `API_SECRET_KEY` | Clave compartida para el header `x-api-key` que protege `/api/search` (uso general) y gatea `?debug=1`. | Opcional, pero **crítica para seguridad** | — | Production, Preview | **Fallback abierto en `isAuthorized()`**: sin configurar, el endpoint principal queda sin autenticación. `isDebugAuthorized()` es lo opuesto — sin configurar, `?debug=1` queda siempre bloqueado (403). |
| `RATE_LIMIT_MAX` | Máximo de requests permitidas por ventana. | Opcional | `60` | Todos | Usa 60. |
| `RATE_LIMIT_WINDOW_MS` | Duración de la ventana de rate limit en ms. | Opcional | `60000` | Todos | Usa 60 segundos. |
| `SEARCH_CACHE_TTL_MS` | TTL del caché de búsqueda. | Opcional | `300000` (5 min) | Todos | Usa 5 minutos. |
| `UPSTASH_REDIS_REST_URL` | URL REST de Upstash Redis (caché + rate limit distribuido). | Opcional | — | Production, Preview | Sin ambas (`URL`+`TOKEN`), cae a caché/rate-limit en memoria — funciona, pero no persiste entre invocaciones serverless frías. |
| `UPSTASH_REDIS_REST_TOKEN` | Token de Upstash Redis. | Opcional | — | Production, Preview | Igual que arriba. |
| `ALGOLIA_APP_ID` | App ID de Algolia (índice de Salcobrand). | Opcional en código, **de facto obligatoria** para que Salcobrand aparezca en resultados | `""` | Todos | Con vacío, la llamada a Algolia falla; Salcobrand desaparece silenciosamente de los resultados (no rompe el resto de la búsqueda). |
| `ALGOLIA_API_KEY` | API Key de Algolia. | Igual que arriba | `""` | Todos | Igual que arriba. |
| `SENTRY_DSN` | DSN del proyecto `comparafarma-api` en Sentry. | Opcional | — | Production | Sin DSN, `captureException()` es no-op explícito — no se pierde funcionalidad, solo se pierde el reporte de errores. |
| `DONATION_BANNER_ENABLED` | Fallback del banner de donación si Supabase `app_config` no responde. | Opcional | `true` | Todos | Banner queda habilitado por default; la fuente de verdad real es la tabla Supabase. |
| `DONATION_BANNER_DISMISS_DAYS` | Días que dura "No mostrar por ahora". | Opcional | `7` | Todos | Usa 7 días. |
| `SUPABASE_URL` | URL del proyecto Supabase. | Opcional | — | Todos | Sin `URL`+`SECRET_KEY`, el cliente Supabase queda `null` — historial de precios, `disabled_pharmacies` y `donation_banner` caen a su fallback de env var/default sin error. El healthcheck reporta `dependencies.supabase: "not_configured"`. |
| `SUPABASE_SECRET_KEY` | Secret key (nunca la publishable) del proyecto Supabase. | Opcional | — | Todos | Igual que arriba. |
| `RESEND_API_KEY` | API Key de Resend (envío de emails: feedback, alertas de precio). | Opcional | — | Production | Sin key, no se envía ningún email — se registra en logs (sin PII, ver RUNBOOK) y la operación sigue "ok". |
| `FEEDBACK_EMAIL` | Email destino de los mensajes de feedback. | Opcional | `mario.lillo.alfaro@gmail.com` | Production | Usa ese email hardcodeado como destino. **No documentada previamente en `.env.example` — corregido en este sprint.** |
| `CRON_SECRET` | Secreto compartido con el cron de GitHub Actions que dispara `GET /api/alerts?action=check`. | **Obligatoria** para que el cron de alertas funcione | — (sin fallback abierto) | Production | Rechaza TODAS las solicitudes a esa ruta con 401 — la revisión diaria de alertas queda inoperante (fail-closed, no crashea el servidor). |
| `GOOGLE_RTDN_SECRET` | Secreto en la URL de push de Google Cloud Pub/Sub (RTDN de Google Play). | **Obligatoria** para RTDN | — (sin fallback abierto) | Production | Rechaza todas las notificaciones RTDN con 401. |
| `FLOW_API_KEY` | API Key de Flow (pagos). | Opcional (degradación explícita) | — | Production | Si falta cualquiera de las 3 variables de Flow, `start-flow-subscription` responde 503 explícito; `flow-register-return`/`flow-webhook` responden 200 con `skipped:"flow-not-configured"` (Flow exige 200 siempre en sus callbacks). |
| `FLOW_SECRET_KEY` | Secret Key de Flow. | Igual que arriba | — | Production | Igual. |
| `FLOW_API_BASE_URL` | `https://sandbox.flow.cl/api` (pruebas) o `https://www.flow.cl/api` (producción). | Igual que arriba | — | Production | Igual. **Sandbox y producción son cuentas separadas — no reusar credenciales.** |
| `WEB_APP_URL` | URL pública de `web/`, usada para construir redirects tras Flow. | Opcional | `https://www.preciosfarma.cl` | Todos | Usa ese default. |
| `API_PUBLIC_URL` | URL pública de esta misma API, usada como `url_return` hacia Flow. | Opcional | `https://comparafarma-api.vercel.app` | Todos | Usa ese default. |
| `DISABLED_PHARMACIES` | Lista separada por comas de `PharmacySlug` a deshabilitar. | Opcional | `""` (ninguna) | Todos | Solo se consulta si Supabase `app_config` no responde. **No documentada previamente — corregido en este sprint.** |
| `ALLOWED_ORIGINS` | Lista de orígenes permitidos para CORS. | Opcional | `["https://www.preciosfarma.cl", "http://localhost:3000"]` | Todos | Usa esa lista fija. Requests sin header `Origin` (app móvil, server-to-server) no se ven afectados. **No documentada previamente — corregido en este sprint.** |
| `KHIPU_RECEIVER_ID` | Receiver ID de Khipu (donaciones vía `/api/donate`). | **Obligatoria** para que `/api/donate` funcione | `""` | Production | Con vacío, `createKhipuPayment` lanza excepción explícita → `500 { error: "No se pudo crear el pago." }` (con reporte a Sentry). **No documentada previamente — corregido en este sprint.** |
| `KHIPU_SECRET` | Secret de Khipu. | Igual que arriba | `""` | Production | Igual. |
| `VERCEL_ENV` | Inyectada automáticamente por Vercel (`production`/`preview`/`development`). | No configurar manualmente | `development` | Automática | Usada por Sentry para etiquetar eventos y por `/api/health` para el campo `environment`. |
| `VERCEL_GIT_COMMIT_SHA` | Inyectada automáticamente por Vercel. | No configurar manualmente | — | Automática | Usada por `/api/health` para el campo `commit` (7 caracteres). Sin ella, reporta `"unknown"`. |

## Web (`web/`)

| Variable | Descripción | Obligatoria | Default | Entorno | Impacto si falta |
|---|---|---|---|---|---|
| `API_URL` | URL del backend (`api/`), consultado server-side. | Opcional | `https://comparafarma-api.vercel.app` | Todos | Usa ese default (apunta a producción). Sin prefijo `NEXT_PUBLIC_` a propósito — solo se usa en Server Components/Actions. |
| `API_SECRET_KEY` (web) | Header `x-api-key` hacia `api/` para operaciones admin. | Opcional | — | Production | Si falta, el header no se envía. Si `api/` sí exige la key y `web/` no la manda, el grant/revoke manual de planes falla silenciosamente (solo `console.warn`, no rompe la página). |
| `SITE_URL` | Dominio base para metadata/OG. | Opcional | `https://www.preciosfarma.cl` | Todos | Usa ese default. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (cliente + servidor). | **Obligatoria** | — (uso con `!` non-null en código) | Todos | Excepción en runtime del SDK de Supabase — no hay degradación silenciosa. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key pública de Supabase. | **Obligatoria** | — | Todos | Igual que arriba. |
| `SUPABASE_URL` (server-only, admin) | URL de Supabase para el cliente admin (`/admin`). | Opcional (fallback controlado) | — | Production | Sin `URL`+`SECRET_KEY`, `createAdminClient()` devuelve `null` → el panel `/admin` muestra un error explícito, no crashea. |
| `SUPABASE_SECRET_KEY` (web) | Secret key para el cliente admin. | Igual que arriba | — | Production | Igual. |
| `ADMIN_ALLOWED_EMAILS` | Lista de emails con acceso a `/admin` vía Google OAuth. | **Obligatoria si se habilita OAuth de admin** | `""` | Production | Con vacío, nadie puede entrar a `/admin` (fail-closed, seguro pero bloquea el acceso). |

## Variables de mayor riesgo operacional

- **`API_SECRET_KEY` (api/)** es la única variable con comportamiento *fail-open*: si no se configura, el endpoint principal de búsqueda queda sin autenticación. Verificar que esté configurada en Production antes de cada release (ver `RELEASE_CHECKLIST.md`).
- **`KHIPU_RECEIVER_ID`/`KHIPU_SECRET`** son las únicas que producen una excepción explícita (500) en vez de degradación silenciosa si faltan — y no estaban documentadas hasta este sprint.
- **`CRON_SECRET`/`GOOGLE_RTDN_SECRET`** son fail-closed por diseño (correcto): sin configurar, esas rutas quedan bloqueadas en vez de abiertas.

## Variables corregidas en este sprint (RC-03)

Estaban en uso en el código pero ausentes de `api/.env.example`; se agregaron en esta revisión: `FEEDBACK_EMAIL`, `DISABLED_PHARMACIES`, `ALLOWED_ORIGINS`, `KHIPU_RECEIVER_ID`, `KHIPU_SECRET`.
