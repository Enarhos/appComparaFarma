# CF-121 — Tests, typecheck y acciones pendientes del CEO

| Campo | Valor |
|---|---|
| **ID** | CF-121 |
| **Épica** | Subscription Platform (Fase 2) |
| **Estado** | ⚠️ Superseded (2026-08-02) por CF-126/CF-127 — Stripe no admite comercios en Chile, ninguna de las acciones pendientes del CEO listadas abajo aplica ya. Ver RFC-005/ADR-0004 |
| **Prioridad** | Media |
| **Estimación** | 1 h |
| **Referencia** | RFC-004 §8, §9 |

---

## Objetivo

Cerrar Fase 2 con la misma vara que Fase 1: todo verde en `api/` y `web/`, y las acciones que solo el CEO puede hacer (cuenta de Stripe, variables de entorno, primer plan vendible) documentadas explícitamente, no perdidas en el código.

## Alcance

### Incluye
- Suite completa de `api/` y `web/` en verde (`pnpm typecheck` + tests de ambos workspaces).
- Este issue documenta, para que no se pierdan, las acciones pendientes de Mario:
  1. Correr en Supabase la sección "Fase 2" de `docs/database/schema.sql` (columna `stripe_price_id`).
  2. Crear (o confirmar que ya existe) una cuenta de Stripe bajo `mario.lillo.alfaro@gmail.com` — modo test primero, live cuando se decida vender de verdad.
  3. Configurar en Vercel (proyecto `comparafarma-api`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (se obtiene al crear el endpoint de webhook en el dashboard de Stripe apuntando a `https://comparafarma-api.vercel.app/api/subscriptions?action=stripe-webhook`), `WEB_APP_URL=https://app-compara-farma-web.vercel.app`.
  4. Definir el primer plan comercial real (nombre, precio, periodicidad) y crearlo como Price en Stripe + fila en `subscription_plans` con `is_available=true` y ese `stripe_price_id` — recién ahí el botón de upgrade aparece en `/cuenta`.

### No incluye
- No decide el precio ni el plan por el CEO — ninguna de estas 4 acciones se ejecuta automáticamente ni se asume un valor por defecto.

## Criterios de aceptación

1. `pnpm typecheck` limpio en `api/` y `web/`.
2. Toda la suite de tests de ambos workspaces en verde, sin romper ningún test de Fase 1/Sprint C/D/E.
3. Las 4 acciones pendientes quedan documentadas en `DECISION_LOG.md` tras el merge, mismo criterio que CF-114 (Service Account de Google) en Fase 1.

## Definición de terminado

- [x] Tests y typecheck verdes
- [ ] Las 4 acciones pendientes ejecutadas por Mario (fuera del alcance de este issue — se registran, no se fuerzan)
