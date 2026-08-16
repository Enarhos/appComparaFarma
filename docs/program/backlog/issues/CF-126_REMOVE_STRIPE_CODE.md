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

- [x] Archivos/acciones de Stripe eliminados de `api/` y `web/` — verificado 2026-08-15: `stripeAdapter.ts`, `createCheckoutSession.ts` y sus tests no existen; único texto "stripe" restante en `api/src` es el literal de tipo `"stripe"` dentro del union `SubscriptionProvider` en `api/src/lib/subscriptionsDb.ts:18` (valor histórico del enum, sin código que lo invoque activamente) y comentarios que documentan la migración desde RFC-004 (permitidos por el propio criterio de aceptación #1 de este issue)
- [x] `.env.example` actualizado — verificado: sin `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`, con `FLOW_API_KEY`/`FLOW_SECRET_KEY`/`FLOW_API_BASE_URL`
- [ ] `pnpm typecheck` y tests verdes en los 4 workspaces — no re-ejecutado en esta tarea de limpieza documental (fuera de alcance: esta tarea no modifica código); recomendado confirmarlo en CI antes de cerrar

**Nota de verificación documental (2026-08-15, Documentation Governance Cleanup):** checklist corregida contra evidencia real del repositorio. Queda un residuo no funcional: el literal `"stripe"` en el tipo `SubscriptionProvider` (`subscriptionsDb.ts:18`). No se modifica ese archivo TypeScript en esta tarea (fuera de alcance de una limpieza documental) — este issue permanece en backlog activo, no se archiva, precisamente para no perder de vista ese residuo hasta que alguien decida retirarlo del código.
