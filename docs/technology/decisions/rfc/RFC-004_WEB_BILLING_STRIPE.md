# RFC-004 — Web Billing Engine (Stripe, Fase 2)

| Campo | Valor |
|---|---|
| **ID** | RFC-004 |
| **Título** | Integración de Stripe Checkout como primer canal de cobro real del Motor de Suscripciones |
| **Estado** | **Superseded (2026-08-02) por [RFC-005](./RFC-005_WEB_BILLING_FLOW.md)** — Stripe no admite comercios domiciliados en Chile (verificado oficialmente al intentar crear la cuenta real), por lo tanto el diseño de este documento nunca pudo usarse end-to-end. El código correspondiente fue eliminado de `main` (decisión del CEO, ver ADR-0004). Se conserva este documento como registro histórico de la decisión y del diseño, no como estado vigente. |
| **Fecha** | 2026-08-02 |
| **Autor** | Claude (rol CTO) |
| **Documentos relacionados** | RFC-003 (motor de suscripciones), ADR-0002, ADR-0003, `docs/product/SUBSCRIPTION_STRATEGY.md`, `docs/product/EPICS.md`, `docs/product/BACKLOG_PRODUCT.md`, `docs/database/schema.sql` |
| **Prioridad** | Media (CFPS 3.2) |

---

## 1. Resumen Ejecutivo

### El problema

Fase 1 (RFC-003) construyó el motor de suscripciones completo del lado `api/` — modelo de datos, servicio, API — pero sin ningún canal de cobro real conectado. El único proveedor implementado (Google Play) no puede cerrar el ciclo completo porque `mobile/` está congelado (Prueba Cerrada) y no puede enviar el purchase token al backend. Hoy no existe ninguna forma de que un usuario real pague por Premium.

### La propuesta

Conectar **Stripe** como primer adaptador de proveedor de pago real, usando **Stripe Checkout hospedado** (no Stripe Elements/Payment Intents embebidos — ver ADR-0003) desde `web/`, que sí tiene sesión de usuario real y no está congelado. Se reutiliza el motor de Fase 1 sin tocarlo: Stripe es "solo otro proveedor que notifica transacciones" vía `recordProviderEvent`, exactamente como está diseñado desde RFC-003.

Se agregan:
- Un campo `stripe_price_id` en `subscription_plans` — el catálogo sigue siendo 100% configurable desde la base de datos, nunca hardcodeado.
- Un adaptador `stripeAdapter.ts` que verifica la firma de los webhooks de Stripe y traduce sus eventos a `NormalizedSubscriptionEvent`.
- Dos acciones nuevas en el endpoint consolidado `api/api/subscriptions.ts`: `create-checkout-session` (inicia el cobro) y `stripe-webhook` (recibe la confirmación). Una acción pública de solo lectura `plans` para que `web/` pueda mostrar los planes vendibles sin hardcodearlos.
- Un botón "Actualizar a Premium" en `/cuenta` que solo aparece si existe al menos un plan `is_available=true` con `stripe_price_id` configurado.

### Qué NO resuelve esta fase (explícito)

- **No define el catálogo comercial real.** Ningún plan con precio real se crea en esta RFC — sigue siendo decisión de negocio del CEO (`SUBSCRIPTION_STRATEGY.md`). El código queda listo para vender en el momento en que se cree una fila en `subscription_plans` con un `stripe_price_id` de un Price real de Stripe.
- **No construye un portal de autogestión de facturación** (cancelar/cambiar de plan desde una página hospedada por Stripe) — es una extensión natural de Fase 2, pero queda fuera de este alcance para no ampliar el diff. Se documenta como candidato de "Fase 2.1" en el roadmap de la Epic.
- **No maneja dunning/reintentos de pago fallido** (`invoice.payment_failed`) — el webhook lo recibe pero lo ignora explícitamente (ver §3.3), documentado como límite conocido, no como bug.
- **No agrega el SDK `stripe` de Node** — se implementa con `fetch` nativo contra la REST API de Stripe y verificación de firma manual con `node:crypto`, siguiendo el estilo del resto de `api/` (clientes de farmacias también son `fetch` puro, sin SDKs).
- **No toca `mobile/`, `packages/domain` ni el adaptador de Google Play** de Fase 1.

---

## 2. Estado Actual (post Fase 1)

- Motor de suscripciones completo y verificado en producción: `getEntitlement`, `recordProviderEvent`, `grantManual`/`revokeManual`, tabla `subscription_plans` con un único plan no vendible (`cortesia`, `is_available=false`).
- `api/api/subscriptions.ts`: 1 función serverless, dispatch por `action` (`me`, `verify-purchase`, `google-rtdn`, `grant-manual`, `revoke-manual`). 10/12 funciones Vercel usadas en total.
- No existe ningún proveedor de pago real conectado. No existe cuenta de Stripe confirmada — se asume que el CEO la crea/gestiona bajo `mario.lillo.alfaro@gmail.com` (mismo criterio que el resto de `SERVICE_ACCOUNT_MIGRATION.md`).
- `web/` ya tiene sesión de usuario real (Sprint D) y `/cuenta` muestra el plan actual — no existe ningún flujo de upgrade.

---

## 3. Arquitectura Propuesta

### 3.1 Modelo de datos (aditivo)

```sql
-- ============================================================
-- Subscription Platform — Fase 2 (RFC-004)
-- ============================================================

-- Mapeo al Price de Stripe que corresponde a cada plan — nullable: un plan
-- puede existir en el catálogo (ej. 'cortesia') sin ser vendible por Stripe.
-- Sigue el mismo principio de Fase 1: el catálogo vive en la base de datos,
-- nunca en código. Crear un plan vendible es insertar una fila con
-- is_available=true, un stripe_price_id de un Price real de Stripe (modo
-- test o live según corresponda) y is_available/status coherentes — nunca
-- requiere un deploy.
alter table subscription_plans add column if not exists stripe_price_id text;
```

No se agregan tablas nuevas — Stripe es "otro proveedor" dentro del modelo ya existente (`subscriptions.provider = 'stripe'`, `subscriptions.provider_reference` = ID de la suscripción de Stripe, `subscription_events` guarda el payload crudo de cada webhook).

### 3.2 Subscription Service — sin cambios

`recordProviderEvent`, `getEntitlement`, `grantManual`/`revokeManual` no se tocan. Se agrega únicamente a `subscriptionsDb.ts`:
- `stripePriceId` en `SubscriptionPlanRow` (mapeo `stripe_price_id` ↔ `stripePriceId`).
- `findAvailablePlans()`: planes con `is_available=true` y `status='active'`, para la acción pública `action=plans`.

### 3.3 Adaptador Stripe (`api/src/lib/adapters/stripeAdapter.ts`, nuevo)

Mismo principio que `googlePlayAdapter.ts`: parsing puro, nunca toca la base de datos — eso es responsabilidad de `subscriptionService.recordProviderEvent()` desde la capa de rutas.

```typescript
// Contrato — no código final
function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): boolean;

type ParsedStripeEvent =
  | { kind: "checkout_completed"; providerReference: string; userId: string; planId: string }
  | { kind: "subscription_renewed"; providerReference: string; periodEnd: string | null }
  | { kind: "subscription_canceled"; providerReference: string }
  | { kind: "ignored" }; // ej. invoice.payment_failed, tipos no manejados en Fase 2

function parseStripeWebhookPayload(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): ParsedStripeEvent | null; // null = firma inválida o payload malformado
```

Eventos de Stripe manejados en Fase 2: `checkout.session.completed` (alta), `customer.subscription.updated` (renovación si `status` es `active`/`trialing`), `customer.subscription.deleted` (cancelación). Todo lo demás (incluido `invoice.payment_failed`) se clasifica `ignored` — 200 OK, sin acción, documentado como límite conocido (equivalente a R-02 de Fase 1: un límite explícito, no un bug).

**Verificación de firma sin el SDK de Stripe:** el header `Stripe-Signature` trae `t=<timestamp>,v1=<firma>`. La firma esperada es `HMAC-SHA256(webhook_secret, "<timestamp>.<raw_body>")`, comparada con `crypto.timingSafeEqual` — algoritmo documentado públicamente por Stripe, implementable con `node:crypto` sin dependencias nuevas.

**Por qué se necesita el body crudo:** la firma se calcula sobre los bytes exactos que Stripe envió, no sobre un objeto ya parseado por el runtime de Vercel. `api/api/subscriptions.ts` agrega `export const config = { api: { bodyParser: false } }` para que ninguna acción de este endpoint consolidado dependa del parseo automático — todas ya pasaban por una lectura manual del stream como respaldo (`parseBody` en `routes/subscriptions.ts`), así que esto no cambia el comportamiento de las acciones de Fase 1.

### 3.4 API — 2 acciones nuevas + 1 de lectura pública, mismo endpoint consolidado

Sin sumar ninguna función serverless nueva (sigue en 10/12):

- `action=plans` (`GET`, público, sin auth) → `findAvailablePlans()`, solo campos seguros de exponer (id, name, referencePrice, currency, billingPeriod, benefits) — nunca `stripe_price_id`.
- `action=create-checkout-session` (`POST`, requiere sesión) → valida el plan (`is_available` + `stripe_price_id` presente), crea una Checkout Session vía REST API de Stripe (`mode=subscription`, `client_reference_id=userId`, `metadata.planId`), devuelve `{ url }`. `success_url`/`cancel_url` se construyen server-side a partir de `WEB_APP_URL` (nunca se aceptan del cliente — evita open redirect).
- `action=stripe-webhook` (`POST`, autenticado por firma `Stripe-Signature` + `STRIPE_WEBHOOK_SECRET`, sin fallback abierto si el secreto no está configurado — mismo criterio que `GOOGLE_RTDN_SECRET`/`CRON_SECRET`) → adaptador → `recordProviderEvent`.

Si `STRIPE_SECRET_KEY` no está configurado, `create-checkout-session` responde `503` con un mensaje claro en vez de fallar de forma confusa — mismo criterio de degradación explícita que el resto de integraciones opcionales del proyecto.

### 3.5 Dónde vive el código

- **`api/src/lib/subscriptionsDb.ts`**: se extiende (no se reescribe) — `stripePriceId`, `findAvailablePlans()`.
- **`api/src/lib/adapters/stripeAdapter.ts`** (nuevo): verificación de firma + parsing, sin I/O.
- **`api/src/routes/subscriptions.ts`**: se extiende con `handlePlans`, `handleCreateCheckoutSession`, `handleStripeWebhook`.
- **`api/api/subscriptions.ts`**: se agrega `export const config = { api: { bodyParser: false } }`.
- **`web/src/lib/plans.ts`** (nuevo): `getAvailablePlans()`, mismo patrón de degradación que `profile.ts` (`[]` si falla).
- **`web/src/app/cuenta/actions/upgrade.ts`** (nuevo, Server Action): `createCheckoutSession(formData)` → llama a la API con el token de sesión, hace `redirect(url)` (Next.js soporta redirects externos desde Server Actions).
- **`web/src/app/cuenta/page.tsx`**: se extiende con la sección de upgrade (solo si hay planes disponibles) y un banner de estado según `?checkout=success|cancelled|error`.
- **`mobile/`, `packages/domain`**: cero cambios.

---

## 4. Compatibilidad

| Aspecto | Estado |
|---|---|
| Acciones existentes de `action=me/verify-purchase/google-rtdn/grant-manual/revoke-manual` | Sin cambios de comportamiento — el cambio a `bodyParser: false` reutiliza el mismo camino de lectura manual que ya existía como respaldo |
| `/admin/usuarios`, `grantManual`/`revokeManual` (CF-116) | Sin cambios — Stripe es un proveedor más, no reemplaza el otorgamiento manual |
| `mobile/` | Cero cambios |
| Catálogo (`subscription_plans`) | Columna nueva nullable — ninguna fila existente se rompe |

---

## 5. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **R-01 — No existe cuenta de Stripe / claves configuradas** | Alta (hecho conocido, no incertidumbre) | Bloquea la verificación end-to-end, no el diseño | `create-checkout-session` degrada a `503` explícito si `STRIPE_SECRET_KEY` no está seteado; documentado como acción pendiente del CEO (CF-121) |
| **R-02 — Verificación de firma implementada a mano (sin SDK)** | Baja si se sigue el algoritmo documentado por Stripe | Alto si está mal — aceptaría webhooks falsificados | Tests unitarios con vectores de firma conocidos (HMAC calculado con el mismo secreto de prueba); `timingSafeEqual` para evitar timing attacks |
| **R-03 — Reprocesamiento de webhooks (Stripe reintenta si no responde 200 rápido)** | Media (comportamiento normal de Stripe) | Bajo — `recordProviderEvent` es naturalmente idempotente vía `findSubscriptionByProviderReference` (busca antes de insertar) | Ya mitigado por el diseño de Fase 1, no requiere código nuevo |
| **R-04 — Catálogo vacío hace que el botón de upgrade no aparezca** | Alta hasta que el CEO cree un plan real | Ninguno (es el comportamiento correcto: no se vende algo que no existe) | `action=plans` devuelve `[]`, `web/` no muestra nada — documentado explícitamente, no es un bug |
| **R-05 — Límite de funciones Vercel** | Ninguna (no se agrega función) | — | Todo consolidado en `api/api/subscriptions.ts`, sigue en 10/12 |

---

## 6. Restricción activa: `mobile/`

Sin cambios. Esta fase vive enteramente en `api/` y `web/`.

---

## 7. Plan de Implementación (mapeado a issues)

| Issue | Alcance |
|---|---|
| CF-117 | Columna `stripe_price_id` en `subscription_plans` (`docs/database/schema.sql`) + `findAvailablePlans()` |
| CF-118 | Adaptador Stripe (`stripeAdapter.ts`): verificación de firma + parsing de eventos, con tests |
| CF-119 | Acciones `plans`, `create-checkout-session`, `stripe-webhook` en `api/api/subscriptions.ts`/`routes/subscriptions.ts` |
| CF-120 | UI de upgrade en `web/` (`/cuenta`, Server Action `createCheckoutSession`) |
| CF-121 | Tests + typecheck de extremo a extremo + documentar acción pendiente del CEO (cuenta de Stripe, variables de entorno, primer plan vendible) |

---

## 8. Definition of Done

- [x] `subscription_plans.stripe_price_id` existe en `docs/database/schema.sql` (pendiente de que el CEO corra el SQL en Supabase, igual que Fase 1)
- [x] `stripeAdapter.parseStripeWebhookPayload` rechaza firmas inválidas y payloads malformados sin lanzar
- [x] `action=plans/create-checkout-session/stripe-webhook` implementados en el endpoint consolidado, sin sumar funciones Vercel
- [x] `/cuenta` muestra "Actualizar a Premium" solo si hay al menos un plan vendible configurado
- [x] Cero cambios en `mobile/src/**` y en `packages/domain`
- [x] `pnpm typecheck` y tests de `api/`/`web/` en verde

---

## 9. Recomendación Final

**¿Se recomienda implementar Fase 2?** Sí — CFPS 3.2, y a diferencia de Fase 1 (habilitante puro) esta fase activa el primer canal de ingreso real disponible hoy. El diseño reutiliza el motor sin tocarlo, no agrega dependencias nuevas, no compromete el límite de funciones de Vercel, y el catálogo comercial sigue siendo una decisión pendiente del CEO — el código no vende nada hasta que él decida qué vender y a qué precio.
