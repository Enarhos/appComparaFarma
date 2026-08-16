# RFC-005 — Web Billing Engine (Flow, Fase 2 corregida)

| Campo | Valor |
|---|---|
| **ID** | RFC-005 |
| **Título** | Integración de Flow como proveedor de pago recurrente del Motor de Suscripciones (reemplaza RFC-004/Stripe) |
| **Estado** | Implementado (2026-08-03) — ratificado por el CEO sin ajustes, ejecutado y mergeado a `main` (PR #36) |
| **Fecha** | 2026-08-02 |
| **Autor** | Claude (rol CTO) |
| **Documentos relacionados** | RFC-004 (Superseded), ADR-0003 (Superseded), ADR-0004, RFC-003, ADR-0002, `docs/archive/product/EPICS_2026-08-15.md`, `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md`, `docs/technology/database/schema.sql` |
| **Prioridad** | Media (CFPS 3.20 — reutiliza el score de Fase 2 ya ratificado; es un cambio de proveedor, no de alcance de producto — ver §7) |

---

## 1. Resumen Ejecutivo

### El problema

RFC-004 implementó Fase 2 completa sobre Stripe. Al crear la cuenta real, se confirmó que **Stripe no soporta comercios en Chile** (verificado oficialmente, no es un problema de configuración). Todo el código de Fase 2 quedó sin poder usarse end-to-end. El CEO evaluó alternativas (Khipu — bloqueada por requerir gestión comercial previa con ventas; Flow — self-service, cuenta ya creada) y decidió reemplazar el proveedor por **Flow**.

### La propuesta

Reemplazar Stripe por Flow como proveedor de pago recurrente, reutilizando el motor de Fase 1 sin tocarlo (Flow es "solo otro proveedor que notifica transacciones" vía `recordProviderEvent`, exactamente igual que Stripe o Google Play). El contrato completo de la API de Flow para suscripciones fue verificado de punta a punta en su sandbox antes de este RFC (ver ADR-0004) — ningún nombre de campo se adivina.

Se agrega:
- Tabla nueva `flow_customers` (identidad de Flow por usuario, independiente de cualquier suscripción — necesaria porque en Flow un cliente se crea y enrola tarjeta *antes* de existir cualquier suscripción).
- Un adaptador `flowAdapter.ts`: firma de parámetros, llamadas HTTP a la API de Flow, resolución de tokens de webhook, parsing del `commerceOrder`.
- Acciones nuevas en el endpoint consolidado `api/api/subscriptions.ts`: `plans` (ya existente, sin cambios — es genérica), `start-flow-subscription` (crea/reusa cliente Flow + inicia enrolamiento de tarjeta), `flow-register-return` (recibe el POST de Flow tras el enrolamiento, confirma estado, crea la suscripción), `flow-webhook` (recibe el `token` de cada cobro periódico).
- Se elimina por completo el código de Stripe (`stripeAdapter.ts`, acciones `create-checkout-session`/`stripe-webhook`, columna `stripe_price_id`, UI de checkout de Stripe en `web/`) — decisión explícita del CEO (ver ADR-0004 §Alternativas).

### Qué NO resuelve esta fase (explícito)

- **No define el catálogo comercial real** — igual que RFC-004, sigue siendo decisión de negocio del CEO.
- **No maneja reintentos de cobro fallido más allá de lo que Flow hace automáticamente** (`charges_retries_number` en el plan) — límite conocido, no bug (ver §5, R-03).
- **No agrega SDK de Node** — `fetch` nativo + `node:crypto`, mismo criterio que Stripe.
- **No toca `mobile/`, `packages/domain` ni el adaptador de Google Play.**
- **No construye autogestión de tarjeta/cancelación** desde `/cuenta` más allá de lo mínimo — cancelar una suscripción de Flow requiere un endpoint adicional (`/subscription/cancel`, no verificado en este RFC porque no es parte del flujo de alta) que queda fuera de este alcance.

---

## 2. Estado Actual (post intento de Fase 2 con Stripe)

- Motor de suscripciones sin cambios desde Fase 1 — `SubscriptionProvider` ya incluye `"flow"` como valor válido desde el diseño original de `subscriptionsDb.ts` (Fase 1), sin necesidad de tocar el tipo.
- Código de Stripe implementado y funcionando técnicamente (tests verdes, typecheck limpio) pero **inutilizable** — no existe forma de crear la cuenta de Stripe necesaria para obtener `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` reales.
- Cuenta de Flow ya creada por el CEO (sandbox y productiva son cuentas separadas — `sandbox.flow.cl` vs `www.flow.cl`, cada una con su propio par de credenciales en "Mis datos → Integración").
- Contrato de suscripciones de Flow verificado manualmente en sandbox: plan `cf_test_diario_914232` → cliente `cus_l3cc364e35` → tarjeta enrolada (Visa terminada en 6623) → suscripción `sus_ra2479246f` creada con el primer invoice ya pagado en el mismo llamado → webhook capturado en `webhook.site` confirmando el patrón `token`-únicamente → resuelto con `GET /payment/getStatus` devolviendo `status:2` y `commerceOrder: "sus_ra2479246f_1183510_2026-08-02 22:02"`.

---

## 3. Arquitectura Propuesta

### 3.1 Modelo de datos (aditivo, con una corrección)

```sql
-- ============================================================
-- Subscription Platform — Fase 2 corregida (RFC-005, reemplaza RFC-004)
-- ============================================================

-- Stripe no es viable para un comercio chileno (ver ADR-0004) — se retira
-- la columna que RFC-004 había agregado. No se reemplaza por un
-- "flow_price_id": Flow permite elegir el planId nosotros mismos, así que
-- se reutiliza subscription_plans.id directo como planId de Flow.
alter table subscription_plans drop column if exists stripe_price_id;

-- Identidad de Flow por usuario — independiente de cualquier suscripción,
-- porque en Flow un cliente se crea y enrola tarjeta ANTES de que exista
-- una suscripción (a diferencia de Stripe Checkout, que resolvía todo en
-- un solo paso). register_status permite saber si un usuario quedó a
-- mitad de camino (cliente creado, tarjeta no confirmada aún).
create table if not exists flow_customers (
  user_id uuid primary key references profiles(id) on delete cascade,
  flow_customer_id text not null unique,
  register_status text not null default 'pending', -- pending | active
  card_brand text,
  card_last4 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table flow_customers enable row level security;
-- Mismo criterio que subscriptions/subscription_plans (Fase 1): sin policies
-- para 'authenticated' — solo el cliente admin (SUPABASE_SECRET_KEY) lee/escribe.
```

No se agregan tablas nuevas para suscripciones/eventos — Flow es "otro proveedor" dentro del modelo ya existente (`subscriptions.provider = 'flow'`, `subscriptions.provider_reference` = `subscriptionId` de Flow, `subscription_events` guarda el payload crudo de cada resolución de webhook).

### 3.2 Subscription Service — sin cambios

`recordProviderEvent`, `getEntitlement`, `grantManual`/`revokeManual` no se tocan — mismo principio que Fase 2 original. Se agrega a `subscriptionsDb.ts`:
- Se quita `stripePriceId` de `SubscriptionPlanRow`/`fromPlanRow`.
- `findFlowCustomer(userId)` / `upsertFlowCustomer(...)`: CRUD mínimo sobre `flow_customers`, mismo patrón de degradación elegante (null/no-op si Supabase falla).

### 3.3 Adaptador Flow (`api/src/lib/adapters/flowAdapter.ts`, nuevo)

Mismo principio que `googlePlayAdapter.ts`/`stripeAdapter.ts` (ya eliminado): funciones puras de parsing/firma, sin I/O directo a la base de datos — eso es responsabilidad de `subscriptionService.recordProviderEvent()` desde la capa de rutas. El llamado HTTP a la API de Flow (`fetch`) sí vive acá, igual que un cliente de farmacia.

```typescript
// Contrato — no código final

function signFlowParams(params: Record<string, string | number>, secretKey: string): string;
// Ordena las claves alfabéticamente, concatena "clave+valor" sin separador,
// HMAC-SHA256 con secretKey, hex digest. Documentado públicamente por Flow.

function callFlow(
  method: "GET" | "POST",
  path: string,
  params: Record<string, string | number>
): Promise<{ status: number; body: unknown }>;
// Agrega apiKey + firma automáticamente. GET → query string. POST →
// application/x-www-form-urlencoded.

function parseSubscriptionCommerceOrder(
  commerceOrder: string
): { flowSubscriptionId: string; invoiceId: string } | null;
// Formato verificado en sandbox: "{subscriptionId}_{invoiceId}_{fecha}".
// null si el formato no matchea (nunca lanza).

type ResolvedFlowPayment =
  | { kind: "invoice_paid"; flowSubscriptionId: string; invoiceId: string; amount: number }
  | { kind: "invoice_unpaid"; flowSubscriptionId: string; invoiceId: string } // status 1/3/4 de /payment/getStatus
  | { kind: "ignored" }; // commerceOrder no matchea el formato de suscripción

async function resolveFlowWebhookToken(token: string): Promise<ResolvedFlowPayment>;
// GET /payment/getStatus?token=... (firmado) → parsea commerceOrder → clasifica
// por status (2 = pagada → invoice_paid; cualquier otro → invoice_unpaid).
```

**Por qué no hay verificación de firma en el webhook entrante (a diferencia de Stripe):** Flow no firma el `POST` al `urlCallback` — solo manda `token` en texto plano. La autenticidad se garantiza indirectamente: ese `token` solo es válido si `GET /payment/getStatus` (firmado con nuestro propio `secretKey`) lo reconoce y devuelve un pago real asociado a nuestra cuenta. Un token falso o de otra cuenta simplemente no resuelve nada (Flow responde error o un pago que no matchea ningún `commerceOrder` nuestro). Esto es una diferencia real de superficie de seguridad frente a Stripe (que sí firma el payload completo) — documentado como riesgo aceptado en §5 (R-01).

### 3.4 Flujo de alta (reemplaza al Checkout de Stripe)

A diferencia de Stripe (una sola redirección resuelve todo), Flow requiere una secuencia de pasos server-side con dos idas y vueltas del navegador:

1. Usuario en `/cuenta` hace clic en "Actualizar a Premium" → `action=start-flow-subscription` (`POST`, requiere sesión, recibe `planId`).
   - Si el usuario no tiene fila en `flow_customers` → `POST /customer/create` (nombre/email del perfil, `externalId=userId`) → guarda `flow_customer_id`, `register_status='pending'`.
   - `POST /customer/register` (`customerId`, `url_return` = URL propia de `api/` para el siguiente paso) → devuelve `{url, token}`.
   - Devuelve `{ redirectUrl: "${url}?token=${token}" }` a `web/`, que redirige el navegador ahí. El `planId` elegido se guarda temporalmente (ej. como query param propio que Flow no toca, o en el propio `flow_customers.register_status`/una columna adicional si hace falta recordar qué plan quería comprar) — detalle a resolver en implementación (CF-124), no bloquea el diseño.
2. Usuario enrola tarjeta en el sitio de Flow (posible paso extra de autenticación bancaria simulada/real).
3. Flow hace `POST` (vía el navegador) a `url_return` con `token` — recibido por `action=flow-register-return` en `api/`:
   - `GET /customer/getRegisterStatus?token=...` → confirma `status:1` (activa) y trae `creditCardType`/`last4CardDigits` → actualiza `flow_customers` (`register_status='active'`, marca de tarjeta).
   - `POST /subscription/create` (`planId`, `customerId`) → Flow devuelve la suscripción activa, con el primer invoice ya cobrado si no hay trial (verificado en sandbox: el cobro es síncrono en esta misma llamada).
   - `recordProviderEvent({ provider: "flow", providerReference: subscriptionId, type: "purchase", userId, planId, periodEnd: subscription.period_end, rawPayload: <respuesta completa> })`.
   - Redirige el navegador a `${WEB_APP_URL}/cuenta?upgrade=success` (o `error` si algún paso falla).
4. Flow hace `POST` (servidor a servidor, sin navegador de por medio — verificado en sandbox por la ausencia de `user-agent`/`referer` en la petición) a la `urlCallback` del plan por cada cobro periódico futuro — recibido por `action=flow-webhook`:
   - Responde `200` de inmediato (Flow espera respuesta en menos de 15s, igual que el resto de su API).
   - `resolveFlowWebhookToken(token)` → si `invoice_paid`: busca la suscripción existente (`findSubscriptionByProviderReference("flow", flowSubscriptionId)`) y llama `recordProviderEvent({ ..., type: "renewal", periodEnd: <de GET /invoice/get(invoiceId)> })`.
   - Si `invoice_unpaid` o `ignored`: se registra igual el evento crudo (para auditoría) pero no se cambia el estado de la suscripción — Flow reintentará según `charges_retries_number` del plan (ver §5, R-03).

### 3.5 API — 3 acciones nuevas + 1 ya existente, mismo endpoint consolidado

Sin sumar funciones serverless nuevas (Fase 2 original dejó el conteo en 10/12; al eliminar `create-checkout-session`/`stripe-webhook` y agregar 3 acciones de Flow, sigue en el mismo endpoint consolidado — 0 funciones nuevas):

- `action=plans` (`GET`, público) — sin cambios respecto a RFC-004, ya no expone ningún campo de Stripe.
- `action=start-flow-subscription` (`POST`, requiere sesión) — inicia el flujo de enrolamiento.
- `action=flow-register-return` (`POST`, público — la autenticidad la valida el llamado a `getRegisterStatus`, no una firma entrante) — completa el alta.
- `action=flow-webhook` (`POST`, público, misma lógica de autenticidad indirecta) — procesa renovaciones.

Si `FLOW_API_KEY`/`FLOW_SECRET_KEY` no están configurados, `start-flow-subscription` responde `503` explícito — mismo criterio de degradación que el resto de integraciones opcionales del proyecto.

### 3.6 Dónde vive el código

- **`api/src/lib/subscriptionsDb.ts`**: se quita `stripePriceId`; se agrega `findFlowCustomer`/`upsertFlowCustomer`.
- **`api/src/lib/adapters/flowAdapter.ts`** (nuevo): firma, llamadas HTTP, resolución de tokens, parsing de `commerceOrder`.
- **`api/src/lib/adapters/stripeAdapter.ts`**: eliminado.
- **`api/src/routes/subscriptions.ts`**: se quitan `handleCreateCheckoutSession`/`handleStripeWebhook`; se agregan `handleStartFlowSubscription`, `handleFlowRegisterReturn`, `handleFlowWebhook`.
- **`api/api/subscriptions.ts`**: `bodyParser: false` se mantiene evaluado — el webhook de Flow no firma el body, así que no es estrictamente necesario para verificación de firma como en Stripe, pero las acciones `flow-register-return`/`flow-webhook` siguen necesitando leer `token` de un body `application/x-www-form-urlencoded`; se decide en CF-124 si se simplifica.
- **`web/src/lib/plans.ts`**: sin cambios (ya es provider-agnostic).
- **`web/src/lib/actions/createCheckoutSession.ts`**: eliminado, reemplazado por `startFlowSubscription.ts`.
- **`web/src/components/cuenta/UpgradeButton.tsx`**: adaptado (llama a la nueva Server Action, misma UX de redirect).
- **`mobile/`, `packages/domain`**: cero cambios.

---

## 4. Compatibilidad

| Aspecto | Estado |
|---|---|
| Acciones existentes de `action=me/verify-purchase/google-rtdn/grant-manual/revoke-manual` | Sin cambios de comportamiento |
| `/admin/usuarios`, `grantManual`/`revokeManual` (CF-116) | Sin cambios |
| `mobile/` | Cero cambios |
| Catálogo (`subscription_plans`) | Se retira una columna nunca poblada con datos reales (ningún plan vendible se creó en Fase 2 original) — sin riesgo de pérdida de datos |

---

## 5. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **R-01 — Webhook de Flow no está firmado, solo trae un token opaco** | Baja (es el diseño documentado de Flow, no una vulnerabilidad nuestra) | Medio si se resuelve mal — un token inválido no debe poder marcar una suscripción como activa | La resolución vía `GET /payment/getStatus` firmado con nuestro `secretKey` es la única fuente de verdad — un token que no pertenece a nuestra cuenta simplemente no devuelve un pago válido nuestro. `resolveFlowWebhookToken` nunca confía en el body del `POST` entrante más allá de extraer el token para resolverlo |
| **R-02 — Secuencia de alta multi-paso (vs. un solo redirect de Stripe)** | Alta (hecho conocido del diseño de Flow) | Bajo — más superficie de código, no de riesgo de seguridad | `flow_customers.register_status` permite detectar y recuperar un alta a medio camino; se documenta como límite conocido de UX, no como bug |
| **R-03 — No se maneja dunning/reintentos de cobro fallido más allá de lo automático de Flow** | Media (comportamiento esperado con tarjetas reales) | Bajo en este alcance (no hay catálogo comercial real todavía) | `charges_retries_number` en el plan delega el reintento a Flow; el webhook de una renovación fallida se registra igual (auditoría) sin downgrade automático — mismo criterio que R-03 de RFC-004 (`invoice.payment_failed` ignorado explícitamente) |
| **R-04 — Reprocesamiento de webhooks** | Media (comportamiento normal de cualquier proveedor) | Bajo — `recordProviderEvent` ya es idempotente vía `findSubscriptionByProviderReference` | Mitigado por el diseño de Fase 1, sin código nuevo |
| **R-05 — Catálogo vacío hace que el botón de upgrade no aparezca** | Alta hasta que el CEO cree un plan real | Ninguno (comportamiento correcto) | Igual que RFC-004 R-04 |
| **R-06 — Límite de funciones Vercel** | Ninguna (no se agrega función) | — | Todo sigue consolidado en `api/api/subscriptions.ts` |

---

## 6. Restricción activa: `mobile/`

Sin cambios. Esta fase vive enteramente en `api/` y `web/`.

---

## 7. ¿Por qué no se re-puntúa con un CFPS nuevo?

Este RFC no cambia el *alcance de producto* que ya fue puntuado y ratificado en Fase 2 original (CFPS 3.20 — habilitar el primer canal de cobro real desde `web/`, con el catálogo comercial todavía sin definir). Cambia únicamente *qué proveedor de pago* implementa ese alcance, por un hecho externo descubierto después de la ratificación (Stripe no admite Chile), no por una decisión de negocio nueva. Se documenta como corrección de Fase 2, no como una fase nueva — consistente con cómo se trató, por ejemplo, la corrección de `araucomed.ts` (CF-111, bugfix, sin CFPS nuevo) frente a un sprint de producto nuevo (que sí lo requiere).

---

## 8. Plan de Implementación (mapeado a issues)

| Issue | Alcance |
|---|---|
| CF-122 | Modelo de datos: `flow_customers`, retirar `stripe_price_id` (`docs/technology/database/schema.sql`, `subscriptionsDb.ts`) |
| CF-123 | Adaptador Flow (`flowAdapter.ts`): firma, llamadas HTTP, resolución de webhook, parsing de `commerceOrder`, con tests |
| CF-124 | Acciones `start-flow-subscription`, `flow-register-return`, `flow-webhook` en `api/api/subscriptions.ts`/`routes/subscriptions.ts` |
| CF-125 | UI de upgrade en `web/` adaptada al flujo de Flow (Server Action + redirect) |
| CF-126 | Eliminar código de Stripe (`stripeAdapter.ts` + tests, acciones/rutas, `createCheckoutSession.ts`, referencias a `stripe_price_id`) |
| CF-127 | Tests + typecheck de extremo a extremo + verificación en sandbox real (parcialmente ya hecha manualmente, ver ADR-0004) + documentar pendientes del CEO |

---

## 9. Definition of Done

- [ ] `flow_customers` existe en `docs/technology/database/schema.sql`, `stripe_price_id` retirada (pendiente de que el CEO corra el SQL en Supabase)
- [ ] `flowAdapter.resolveFlowWebhookToken` maneja tokens válidos, inválidos y `commerceOrder` malformado sin lanzar
- [ ] `action=start-flow-subscription/flow-register-return/flow-webhook` implementados, sin sumar funciones Vercel
- [ ] `/cuenta` muestra "Actualizar a Premium" solo si hay al menos un plan vendible configurado
- [ ] Código de Stripe eliminado de `main` (ninguna referencia viva a `STRIPE_*`/`stripe_price_id`)
- [ ] Cero cambios en `mobile/src/**` y en `packages/domain`
- [ ] `pnpm typecheck` y tests de `api/`/`web/` en verde

---

## 10. Recomendación Final

**¿Se recomienda implementar esta corrección?** Sí — es la única forma de que Fase 2 (ya ratificada, CFPS 3.20) llegue a producción con un proveedor real. El diseño reutiliza el motor sin tocarlo, no agrega dependencias nuevas, no compromete el límite de funciones de Vercel, y todo el contrato de Flow fue verificado empíricamente en sandbox antes de este documento — no queda ningún nombre de campo por confirmar.
