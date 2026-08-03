# CF-118 — Adaptador Stripe (verificación de firma + parsing)

| Campo | Valor |
|---|---|
| **ID** | CF-118 |
| **Épica** | Subscription Platform (Fase 2) |
| **Estado** | ✅ Implementado (2026-08-02) |
| **Prioridad** | Media |
| **Estimación** | 2-2.5 h |
| **Referencia** | RFC-004 §3.3, ADR-0003 |

---

## Objetivo

Traducir los webhooks de Stripe a `NormalizedSubscriptionEvent`, verificando su firma sin depender del SDK de Stripe (ver ADR-0003).

## Alcance

### Incluye
- `api/src/lib/adapters/stripeAdapter.ts` (nuevo):
  - `verifyStripeSignature(rawBody, signatureHeader, secret)` — HMAC-SHA256 sobre `"{timestamp}.{rawBody}"`, comparación con `crypto.timingSafeEqual`.
  - `parseStripeWebhookPayload(rawBody, signatureHeader, secret)` — verifica firma, parsea el JSON, y clasifica el evento en `checkout_completed` / `subscription_renewed` / `subscription_canceled` / `ignored`. Nunca lanza: firma inválida o payload malformado → `null`.
- Eventos manejados: `checkout.session.completed`, `customer.subscription.updated` (solo si `status` es `active`/`trialing`), `customer.subscription.deleted`. Todo lo demás (incluido `invoice.payment_failed`) → `ignored`.

### No incluye
- No hace ninguna llamada HTTP ni escribe en Supabase — es parsing puro, igual que `googlePlayAdapter.ts`.
- No maneja reintentos de pago fallido (dunning) — límite documentado, no bug.

## Criterios de aceptación

1. Firma inválida (secreto incorrecto o timestamp/payload alterado) → `null`, nunca lanza.
2. `checkout.session.completed` sin `client_reference_id` o sin `metadata.planId` → `null` (payload incompleto, se descarta con seguridad).
3. Tipos de evento no manejados → `{ kind: "ignored" }`, no `null` (distinción entre "firma inválida" y "evento válido que no nos interesa").

## Definición de terminado

- [x] `stripeAdapter.ts` implementado
- [x] Tests con vectores de firma real (HMAC calculado con un secreto de prueba) cubriendo firma válida, inválida, y los 4 tipos de evento
