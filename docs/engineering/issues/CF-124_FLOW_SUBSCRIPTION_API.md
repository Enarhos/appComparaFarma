# CF-124 — Acciones `start-flow-subscription`, `flow-register-return`, `flow-webhook`

| Campo | Valor |
|---|---|
| **ID** | CF-124 |
| **Épica** | Subscription Platform (Fase 2 corregida) |
| **Estado** | ✅ Implementado (2026-08-03) |
| **Prioridad** | Media |
| **Estimación** | 3-4 h |
| **Referencia** | RFC-005 §3.4, §3.5, ADR-0004 |

---

## Objetivo

Implementar el flujo de alta multi-paso de Flow (crear/reusar cliente → enrolar tarjeta → confirmar → crear suscripción) y la recepción de cobros periódicos, en el endpoint consolidado `api/api/subscriptions.ts`, sin sumar funciones serverless nuevas.

## Alcance

### Incluye
- `action=start-flow-subscription` (`POST`, sesión requerida): crea/reusa `flow_customers`, llama `/customer/register`, devuelve `{ redirectUrl }`.
- `action=flow-register-return` (`POST`, público): recibe `token`, confirma vía `getRegisterStatus`, crea la suscripción (`/subscription/create`), llama `recordProviderEvent(type: "purchase")`, redirige a `${WEB_APP_URL}/cuenta?upgrade=success|error`.
- `action=flow-webhook` (`POST`, público): recibe `token`, resuelve con `flowAdapter.resolveFlowWebhookToken`, llama `recordProviderEvent(type: "renewal")` si `invoice_paid`, responde `200` en menos de 15s siempre (incluso si el procesamiento falla internamente — se loguea, no se cuelga la respuesta).
- Decidir y documentar cómo se recuerda qué `planId` quería comprar el usuario entre el paso 1 y el paso 3 (ver RFC-005 §3.4, nota "detalle a resolver en implementación").

### No incluye
- No implementa cancelación ni cambio de plan desde `/cuenta`.
- No agrega función serverless nueva — todo dentro de `api/api/subscriptions.ts`.

## Criterios de aceptación

1. `start-flow-subscription` sin sesión responde 401, no llama a Flow.
2. `flow-register-return` con un `token` que no confirma tarjeta activa no crea ninguna suscripción.
3. `flow-webhook` siempre responde `200` (incluso ante error interno), consistente con el comportamiento esperado por Flow.
4. Conteo de funciones Vercel sigue igual que antes de este issue (verificar `api/vercel.json` / cantidad de archivos en `api/api/`).

## Definición de terminado

- [ ] 3 acciones implementadas en `routes/subscriptions.ts`, despachadas desde `api/api/subscriptions.ts`
- [ ] Tests de cada acción (feliz + casos de error)
- [ ] Verificado manualmente contra el sandbox real de Flow (reusando lo aprendido en `flow-sandbox-test.js`)
