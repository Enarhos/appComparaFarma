# CF-122 — Tabla `flow_customers` + retirar `stripe_price_id`

| Campo | Valor |
|---|---|
| **ID** | CF-122 |
| **Épica** | Subscription Platform (Fase 2 corregida) |
| **Estado** | ✅ Implementado (2026-08-03) |
| **Prioridad** | Media |
| **Estimación** | 1-1.5 h |
| **Referencia** | RFC-005 §3.1, ADR-0004 |

---

## Objetivo

Modelar la identidad de Flow por usuario (cliente + tarjeta enrolada) de forma independiente a cualquier suscripción — necesario porque en Flow un cliente se crea y enrola tarjeta *antes* de que exista una suscripción, a diferencia del flujo de un solo paso de Stripe Checkout.

## Alcance

### Incluye
- `create table if not exists flow_customers (...)` en `docs/database/schema.sql` (sección Fase 2 corregida, aditiva): `user_id` (PK, FK a `auth.users`), `flow_customer_id`, `register_status` (`pending`/`active`), `card_brand`, `card_last4`, timestamps. RLS habilitado, sin policies para `authenticated` (mismo criterio que `subscriptions`).
- `alter table subscription_plans drop column if exists stripe_price_id;` — nunca se pobló con datos reales, sin riesgo de pérdida.
- `findFlowCustomer(userId)` / `upsertFlowCustomer(...)` en `api/src/lib/subscriptionsDb.ts`, mismo patrón de degradación elegante que el resto del archivo.
- Quitar `stripePriceId` de `SubscriptionPlanRow`/`PlanRowRaw`/`fromPlanRow`.

### No incluye
- No define ningún plan comercial real.
- No agrega columna de mapeo de plan (`planId` de Flow = `subscription_plans.id` directo, ver ADR-0004).

## Criterios de aceptación

1. `flow_customers` existe, `user_id` único (un cliente Flow por usuario).
2. Ninguna fila existente de `subscription_plans` se rompe al retirar la columna.
3. `findFlowCustomer`/`upsertFlowCustomer` devuelven `null`/no-op con Supabase ausente, nunca lanzan.
4. Tests de `subscriptionsDb.test.ts` actualizados (quitar asserts de `stripePriceId`, agregar los de `flow_customers`).

## Definición de terminado

- [x] SQL agregado a `schema.sql` — verificado 2026-08-15: `flow_customers` existe en `docs/database/schema.sql` (RLS habilitada, `user_id` único), `stripe_price_id` retirado
- [ ] SQL corrido en Supabase (a cargo de Mario) — pendiente, no verificable desde el repositorio; ver `docs/program/DECISION_QUEUE.md` (mismo patrón que CF-112)
- [x] `findFlowCustomer`/`upsertFlowCustomer` implementadas y testeadas — verificado 2026-08-15 en `api/src/lib/subscriptionsDb.ts` y `api/src/__tests__/subscriptionsDb.test.ts`

**Nota de verificación documental (2026-08-15, Documentation Governance Cleanup):** el encabezado "Implementado" reflejaba correctamente el código, pero la checklist no estaba sincronizada. Corregida contra evidencia real del repositorio. El único ítem genuinamente pendiente (ejecución del SQL en Supabase) es una acción externa idéntica en naturaleza a la de CF-112 — este issue permanece en backlog activo por esa razón, no por falta de código.
