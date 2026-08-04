# CF-126 — Eliminar código de Stripe

| Campo | Valor |
|---|---|
| **ID** | CF-126 |
| **Épica** | Subscription Platform (Fase 2 corregida) |
| **Estado** | ✅ Implementado (2026-08-03) |
| **Prioridad** | Media |
| **Estimación** | 0.5-1 h |
| **Referencia** | RFC-005 §1, §3.6, ADR-0004 |

---

## Objetivo

Retirar de `main` el código de Stripe implementado en la Fase 2 original — decisión explícita del CEO (Stripe no es viable para un comercio chileno; no se mantiene código muerto en el repo). La documentación (RFC-004, ADR-0003, CF-117 a CF-121) se conserva marcada como Superseded, no se elimina.

## Alcance

### Incluye
- Eliminar `api/src/lib/adapters/stripeAdapter.ts` y `api/src/__tests__/stripeAdapter.test.ts`.
- Eliminar `handleCreateCheckoutSession`/`handleStripeWebhook` de `api/src/routes/subscriptions.ts` y sus casos en el dispatcher de `api/api/subscriptions.ts`.
- Eliminar `web/src/lib/actions/createCheckoutSession.ts` y su test (reemplazados por `startFlowSubscription.ts`, CF-125).
- Quitar `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` de `api/.env.example`, agregar `FLOW_API_KEY`/`FLOW_SECRET_KEY`/`FLOW_API_BASE_URL`.
- Quitar toda referencia a `stripe_price_id`/`stripePriceId` restante (después de CF-122).
- Verificar que no queda ninguna importación rota tras los retiros.

### No incluye
- No modifica `RFC-004_WEB_BILLING_STRIPE.md`/`ADR-0003_STRIPE_CHECKOUT_HOSTED.md`/`CF-117` a `CF-121` más allá de lo ya hecho (marcados Superseded) — quedan como registro histórico.

## Criterios de aceptación

1. `git grep -i stripe` en `api/src` y `web/src` no devuelve nada (fuera de comentarios que expliquen la migración, si los hay).
2. `pnpm typecheck` limpio en los 4 workspaces tras el retiro.
3. Ningún test hace referencia a Stripe.

## Definición de terminado

- [ ] Archivos/acciones de Stripe eliminados de `api/` y `web/`
- [ ] `.env.example` actualizado
- [ ] `pnpm typecheck` y tests verdes en los 4 workspaces
