# CF-119 — Acciones `plans`, `create-checkout-session`, `stripe-webhook`

| Campo | Valor |
|---|---|
| **ID** | CF-119 |
| **Épica** | Subscription Platform (Fase 2) |
| **Estado** | ⚠️ Superseded (2026-08-02) por CF-124 (acciones Flow) — Stripe no admite comercios en Chile. Código eliminado de `main`. Ver RFC-005/ADR-0004 |
| **Prioridad** | Media |
| **Estimación** | 2-3 h |
| **Referencia** | RFC-004 §3.4, ADR-0002 |

---

## Objetivo

Exponer el flujo de cobro real vía el endpoint consolidado existente, sin sumar funciones serverless (sigue en 10/12).

## Alcance

### Incluye
- `api/api/subscriptions.ts`: `export const config = { api: { bodyParser: false } }` — necesario para que `stripe-webhook` tenga acceso al body crudo (la firma se calcula sobre los bytes exactos).
- `api/src/routes/subscriptions.ts`:
  - `handlePlans` (`GET action=plans`, público) → `findAvailablePlans()`, solo campos seguros (nunca `stripe_price_id`).
  - `handleCreateCheckoutSession` (`POST action=create-checkout-session`, requiere sesión Bearer) → valida plan (`is_available` + `stripe_price_id`), crea Checkout Session vía REST API de Stripe (`fetch`, sin SDK), devuelve `{ url }`. `success_url`/`cancel_url` construidos server-side desde `WEB_APP_URL`, nunca aceptados del cliente.
  - `handleStripeWebhook` (`POST action=stripe-webhook`, autenticado por `Stripe-Signature` + `STRIPE_WEBHOOK_SECRET`, sin fallback abierto) → adaptador → `recordProviderEvent`.
- Nuevas variables de entorno en `api/.env.example`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `WEB_APP_URL`.

### No incluye
- No implementa el Billing Portal de Stripe (autogestión de cancelación) — Fase 2.1 futura.
- No reintenta ni hace backoff de webhooks fallidos — Stripe ya reintenta automáticamente; `recordProviderEvent` es idempotente (busca antes de insertar).

## Criterios de aceptación

1. `action=create-checkout-session` sin `STRIPE_SECRET_KEY` configurado → `503` con mensaje claro, nunca un error genérico.
2. `action=stripe-webhook` sin `STRIPE_WEBHOOK_SECRET` configurado → `401` para toda solicitud, sin excepción (mismo criterio que `GOOGLE_RTDN_SECRET`).
3. `action=plans` nunca expone `stripe_price_id` en la respuesta.
4. Las acciones existentes de Fase 1 (`me`, `verify-purchase`, `google-rtdn`, `grant-manual`, `revoke-manual`) siguen funcionando igual con `bodyParser: false`.

## Definición de terminado

- [x] 3 acciones implementadas en el endpoint consolidado
- [x] Variables de entorno documentadas en `.env.example`
- [x] Tests de las 3 acciones + regresión de las 5 acciones existentes de Fase 1
