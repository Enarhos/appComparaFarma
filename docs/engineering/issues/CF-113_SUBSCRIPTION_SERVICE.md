# CF-113 — Subscription Service (motor + tests)

| Campo | Valor |
|---|---|
| **ID** | CF-113 |
| **Épica** | Subscription Platform (Fase 1) |
| **Estado** | ✅ Implementado (2026-08-02) |
| **Prioridad** | Media |
| **Estimación** | 3-4 h |
| **Referencia** | RFC-003 §3.2, ADR-0002 |

---

## Objetivo

Implementar el módulo que decide, para cualquier usuario, si tiene acceso Premium — sin depender de ningún proveedor de pago en el momento de la consulta.

## Alcance

### Incluye
- `api/src/lib/subscriptionsDb.ts` (nuevo): acceso a datos sobre `subscription_plans`/`subscriptions`/`subscription_events`, con degradación elegante si Supabase no responde (mismo patrón que `priceHistoryDb.ts`/`medicationRegistry.ts` — nunca lanza, nunca rompe al que lo llama).
- `api/src/services/subscriptionService.ts` (nuevo):
  - `getEntitlement(userId): Promise<Entitlement>` — única función que determina acceso Premium.
  - `recordProviderEvent(event: NormalizedSubscriptionEvent): Promise<void>` — punto de entrada de cualquier adaptador.
  - `grantManual(userId, planId, expiresAt?): Promise<void>` — otorgamiento manual (reemplaza el write directo de Sprint D).
- Tests unitarios (`api/src/__tests__/subscriptionService.test.ts`, nuevo): Supabase ausente → `getEntitlement` devuelve `{active: false}` sin lanzar; usuario con suscripción `active` y `current_period_end` futuro → `active: true`; usuario con suscripción `expired` → `active: false`; `recordProviderEvent` inserta en `subscription_events` y actualiza/crea la fila de `subscriptions` correspondiente; `grantManual` crea una suscripción con `provider: 'manual'`.

### No incluye
- No incluye ningún adaptador de proveedor específico (ver CF-114).
- No incluye la API HTTP (ver CF-115).

## Criterios de aceptación

1. `getEntitlement` nunca lanza, incluso con Supabase completamente ausente.
2. Los 3 estados relevantes (`active`, `expired`, sin suscripción) devuelven el resultado correcto.
3. Cobertura de tests equivalente a la de `medicationRegistry.test.ts` (módulo similar en patrón).

## Definición de terminado

- [x] `subscriptionsDb.ts` implementado
- [x] `subscriptionService.ts` implementado (`getEntitlement`, `recordProviderEvent`, `grantManual`, `revokeManual`)
- [x] Tests nuevos en verde (18 tests: 6 en `subscriptionsDb.test.ts`, 12 en `subscriptionService.test.ts`)
- [x] `pnpm --filter api test` y `pnpm typecheck` en verde
