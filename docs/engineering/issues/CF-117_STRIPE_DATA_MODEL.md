# CF-117 — Columna `stripe_price_id` + `findAvailablePlans()`

| Campo | Valor |
|---|---|
| **ID** | CF-117 |
| **Épica** | Subscription Platform (Fase 2) |
| **Estado** | ✅ Implementado (2026-08-02) |
| **Prioridad** | Media |
| **Estimación** | 0.5-1 h |
| **Referencia** | RFC-004 §3.1, ADR-0003 |

---

## Objetivo

Permitir que cualquier fila de `subscription_plans` se pueda vender por Stripe, mapeándola a un Price real, sin tocar código cuando se agrega un plan nuevo.

## Alcance

### Incluye
- `alter table subscription_plans add column if not exists stripe_price_id text;` en `docs/database/schema.sql` (sección Fase 2, aditiva).
- `stripePriceId` en `SubscriptionPlanRow`/`fromPlanRow` (`api/src/lib/subscriptionsDb.ts`).
- `findAvailablePlans()`: planes con `is_available=true` y `status='active'`, ordenados por `reference_price` ascendente.

### No incluye
- No crea ningún plan vendible real — el catálogo sigue vacío salvo `cortesia` (no vendible).

## Criterios de aceptación

1. La columna existe y es `nullable` — ninguna fila existente se rompe.
2. `findAvailablePlans()` devuelve `[]` con Supabase ausente o sin planes disponibles (degradación elegante, nunca lanza).
3. `findPlan()` sigue funcionando igual para `cortesia` (usado por `grantManual`, CF-116).

## Definición de terminado

- [x] SQL agregado a `schema.sql`
- [ ] SQL corrido en Supabase (a cargo de Mario, mismo flujo que Fase 1)
- [x] `findAvailablePlans()` implementada y testeada
