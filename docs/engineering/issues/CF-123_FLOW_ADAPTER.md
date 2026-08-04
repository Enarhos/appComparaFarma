# CF-123 — Adaptador Flow (firma, llamadas HTTP, resolución de webhook)

| Campo | Valor |
|---|---|
| **ID** | CF-123 |
| **Épica** | Subscription Platform (Fase 2 corregida) |
| **Estado** | ✅ Implementado (2026-08-03) |
| **Prioridad** | Media |
| **Estimación** | 2.5-3 h |
| **Referencia** | RFC-005 §3.3, ADR-0004 |

---

## Objetivo

Encapsular toda la interacción con la REST API de Flow (firma HMAC-SHA256, llamadas `fetch`, resolución de tokens de webhook, parsing de `commerceOrder`) en un módulo puro que `subscriptionService`/las rutas puedan usar sin conocer el detalle de la API de Flow.

## Alcance

### Incluye
- `signFlowParams(params, secretKey)`: ordena claves alfabéticamente, concatena `clave+valor`, HMAC-SHA256, hex digest — algoritmo verificado contra la doc oficial y contra el sandbox real (ver `flow-sandbox-test.js`, script de verificación manual usado para este RFC).
- `callFlow(method, path, params)`: agrega `apiKey`+firma, hace la llamada (`GET`→query string, `POST`→`application/x-www-form-urlencoded`), parsea la respuesta JSON.
- `parseSubscriptionCommerceOrder(commerceOrder)`: extrae `{ flowSubscriptionId, invoiceId }` del formato `"{subscriptionId}_{invoiceId}_{fecha}"` verificado en sandbox. `null` si no matchea, nunca lanza.
- `resolveFlowWebhookToken(token)`: `GET /payment/getStatus` firmado → clasifica en `invoice_paid`/`invoice_unpaid`/`ignored` según `status` y si el `commerceOrder` matchea el formato de suscripción.
- Tests con vectores de firma conocidos (mismos valores que Flow documenta como ejemplo) + fixtures de las respuestas reales capturadas en el sandbox durante la verificación de este RFC.

### No incluye
- No hace ninguna escritura a Supabase — eso es responsabilidad de `subscriptionService.recordProviderEvent()` desde la capa de rutas (CF-124).
- No implementa cancelación de suscripción (`/subscription/cancel`, no verificado en este ciclo).

## Criterios de aceptación

1. `signFlowParams` produce la misma firma que el ejemplo documentado por Flow para los mismos parámetros de entrada.
2. `resolveFlowWebhookToken` con un token inválido/de otra cuenta devuelve `ignored` sin lanzar (Flow responde error o un pago no reconocible).
3. `parseSubscriptionCommerceOrder` con un formato inesperado devuelve `null`, no lanza.
4. Cobertura de test para los 3 casos de `ResolvedFlowPayment` (`invoice_paid`, `invoice_unpaid`, `ignored`).

## Definición de terminado

- [ ] `api/src/lib/adapters/flowAdapter.ts` implementado
- [ ] Tests con vectores de firma + fixtures reales del sandbox
- [ ] `pnpm --filter api test` verde
