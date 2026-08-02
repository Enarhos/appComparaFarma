# CF-115 — API de suscripciones (`api/api/subscriptions.ts`)

| Campo | Valor |
|---|---|
| **ID** | CF-115 |
| **Épica** | Subscription Platform (Fase 1) |
| **Estado** | ✅ Implementado (2026-08-02) |
| **Prioridad** | Media |
| **Estimación** | 2-3 h |
| **Referencia** | RFC-003 §3.4, patrón de consolidación de Sprint C (`api/api/alerts.ts`) |

---

## Objetivo

Exponer el Subscription Service vía HTTP sin sumar más de una función serverless nueva (Vercel Hobby, límite 12, hoy en 9/12).

## Alcance

### Incluye
- `api/api/subscriptions.ts` (nuevo, entrypoint delgado) + `api/src/routes/subscriptions.ts` (handler real), consolidados en **una sola función** con dispatch por query param `action`, mismo patrón que `alerts.ts`:
  - `action=me` (`GET`, requiere sesión Supabase) → llama `getEntitlement(userId)`, responde `{ active, planId, benefits, expiresAt }`.
  - `action=google-rtdn` (`POST`, autenticado por la verificación propia de Google Pub/Sub push, **no** por `API_SECRET_KEY`) → adaptador de Google Play → `recordProviderEvent`.
  - `action=verify-purchase` (`POST`, requiere sesión) → reservado para cuando `mobile/` pueda enviar un purchase token; puede implementarse ya (la ruta no depende de `mobile/`), aunque no habrá ningún cliente real que la llame hasta entonces.
- Tests de ruta (`api/src/__tests__/subscriptions.test.ts`, nuevo), mismo estilo que `alerts.test.ts`.

### No incluye
- No agrega ninguna otra función serverless — todo pasa por este único archivo.
- No implementa autenticación nueva — reutiliza el mecanismo de sesión de Supabase ya usado en `web/`.

## Criterios de aceptación

1. El conteo de funciones serverless en `api/api/` queda en 10/12 tras esta issue (verificar contando archivos en `api/api/*.ts`).
2. `action=me` requiere sesión válida y devuelve 401 sin ella.
3. `action=google-rtdn` rechaza payloads que no pasen la verificación de origen de Google.
4. Tests nuevos en verde, suite completa de `api/` sin regresiones.

## Definición de terminado

- [x] `api/api/subscriptions.ts` + `api/src/routes/subscriptions.ts` implementados (`action=me`, `verify-purchase`, `google-rtdn`, `grant-manual`, `revoke-manual`)
- [x] Tests nuevos en verde (15 tests)
- [x] Confirmado que `api/vercel.json` sigue cubriendo el archivo nuevo con el glob existente — 10/12 funciones
- [x] `pnpm --filter api test` y `pnpm typecheck` en verde
- [x] `GOOGLE_RTDN_SECRET` documentado en `api/.env.example`
