# CF-125 — UI de upgrade en `web/` adaptada a Flow

| Campo | Valor |
|---|---|
| **ID** | CF-125 |
| **Épica** | Subscription Platform (Fase 2 corregida) |
| **Estado** | ✅ Implementado (2026-08-03) |
| **Prioridad** | Media |
| **Estimación** | 1.5-2 h |
| **Referencia** | RFC-005 §3.4, §3.6 |

---

## Objetivo

Adaptar la UI de upgrade de `/cuenta` al flujo de Flow: sigue siendo un botón que redirige fuera de `web/`, pero apunta a `start-flow-subscription` en vez de `create-checkout-session`.

## Alcance

### Incluye
- `web/src/lib/actions/startFlowSubscription.ts` (Server Action, reemplaza `createCheckoutSession.ts`): llama a `action=start-flow-subscription` con el token de sesión, `redirect(url)`.
- `web/src/components/cuenta/UpgradeButton.tsx`: se actualiza para llamar a la nueva Server Action — misma UX (botón → redirect externo).
- `web/src/app/cuenta/page.tsx`: banner de estado según `?upgrade=success|error` (antes `?checkout=...`).
- `getAvailablePlans()` (`web/src/lib/plans.ts`): sin cambios, ya es provider-agnostic.

### No incluye
- No construye ninguna pantalla intermedia para el paso de enrolamiento de tarjeta — ese paso ocurre en el sitio de Flow, fuera de `web/`.

## Criterios de aceptación

1. `/cuenta` muestra "Actualizar a Premium" solo si `getAvailablePlans()` devuelve al menos un plan.
2. Click en el botón redirige al usuario a Flow (URL real de `sandbox.flow.cl`/`www.flow.cl` según entorno).
3. Vuelta con `?upgrade=success` muestra confirmación; `?upgrade=error` muestra mensaje claro sin romper la página.

## Definición de terminado

- [ ] `startFlowSubscription.ts` implementado con tests (mismo patrón que `createCheckoutSession.test.ts`)
- [ ] `UpgradeButton.tsx` actualizado
- [ ] `pnpm --filter web test` + `pnpm --filter web typecheck` verdes
