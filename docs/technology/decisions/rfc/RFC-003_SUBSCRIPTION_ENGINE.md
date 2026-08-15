# RFC-003 — Subscription Engine (Motor de Suscripciones, Fase 1)

| Campo | Valor |
|---|---|
| **ID** | RFC-003 |
| **Título** | Motor de Suscripciones independiente de proveedor de pago — modelo de datos, servicio, adaptador Google Play, API |
| **Estado** | Propuesto — pendiente de ratificación CFPS antes de implementar (Regla 2 del `PRODUCT_DECISION_FRAMEWORK.md`) |
| **Fecha** | 2026-08-02 |
| **Autor** | Claude (rol CTO) |
| **Documentos relacionados** | `docs/product/SUBSCRIPTION_STRATEGY.md`, `docs/archive/product/EPICS_2026-08-15.md` (Epic "Subscription Platform"), `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md`, ADR-0002, `docs/technology/database/schema.sql` |
| **Prioridad** | Media (CFPS 3.0) — infraestructura habilitante, no resuelve un incidente activo |

---

## 1. Resumen Ejecutivo

### El problema

Sprint D (2026-08-02) introdujo `profiles.plan: 'free' | 'premium'` como una solución mínima para poder mostrar u ocultar funcionalidades por usuario, sin flujo de pago. Es deliberadamente simple: un campo plano, sin vigencia, sin proveedor, sin bitácora, escribible solo a mano desde `/admin/usuarios`. Eso fue correcto para esa etapa, pero no alcanza para lo que viene: el día que exista un pago real (Google Play, Stripe, etc.), no hay dónde registrar cuándo empezó la suscripción, cuándo vence, qué proveedor la originó, ni qué pasó en cada renovación o cancelación.

### La propuesta

Reemplazar la fuente de verdad del estado Premium por un **Subscription Service** desacoplado de cualquier proveedor de pago, con:
- Un modelo de datos que separa **catálogo de planes** (configurable, nunca hardcodeado), **suscripciones** (una fila por usuario con vigencia y proveedor) y **eventos** (bitácora inmutable de cada transacción notificada).
- Una única función `getEntitlement(userId)` que determina si un usuario tiene acceso Premium y con qué beneficios — la única puerta de entrada, para cualquier cliente (web hoy, mobile a futuro).
- Adaptadores por proveedor (`PaymentProviderAdapter`) que normalizan la notificación de cada proveedor a un evento común. Fase 1 implementa solo el adaptador de Google Play.
- `profiles.plan` pasa de fuente de verdad a campo derivado/cacheado, actualizado únicamente por el motor.

### Qué NO resuelve esta fase (explícito)

- No construye ningún flujo de compra del lado del cliente — eso requiere tocar `mobile/`, que está congelado (ver §6).
- No implementa Stripe, Apple, Flow ni Mercado Pago — quedan en Fase 2/3 de la Epic.
- No construye UI de planes/promociones/cupones — Fase 4 de la Epic.
- No decide precios ni qué planes existen comercialmente — eso es una decisión de negocio, no técnica (`SUBSCRIPTION_STRATEGY.md`), y el catálogo queda vacío o con un plan de prueba hasta que el CEO lo defina.

---

## 2. Estado Actual

- `profiles` (`docs/technology/database/schema.sql`, sección Sprint D): `id`, `email`, `plan text default 'free'`, `created_at`, `updated_at`. RLS: el usuario lee su propia fila; nadie (ni siquiera el propio usuario autenticado) tiene policy de `update` — solo el cliente admin (`SUPABASE_SECRET_KEY`, bypassea RLS) escribe.
- `web/src/lib/profilesAdmin.ts`: `setProfilePlan(id, plan)` hace `update profiles set plan = ...` directo — es el único punto de escritura hoy.
- `web/src/lib/profile.ts`: `getCurrentProfile()` lee `profiles.plan` directo desde el cliente con sesión.
- No existe ningún adaptador de proveedor de pago, ninguna tabla de suscripciones ni de eventos. `mobile/` no tiene ninguna integración de Google Play Billing.
- Vercel Hobby: `api/vercel.json` con glob `"api/*.ts"`, 9 funciones serverless activas hoy (`health`, `search`, `feedback`, `config`, `branches`, `donate`, `go`, `price-history`, `alerts`) — límite del plan es 12.

---

## 3. Arquitectura Propuesta

### 3.1 Modelo de datos (Supabase, aditivo — sigue el estilo `if not exists` de `schema.sql`)

```sql
-- ============================================================
-- Subscription Platform — Fase 1 (RFC-003)
-- ============================================================

create table if not exists subscription_plans (
  id text primary key,                      -- código estable, ej. 'premium_monthly', 'cortesia'
  name text not null,
  product_type text not null default 'app',  -- 'app' | 'family' | 'business' | 'api' | 'other'
  billing_period text,                       -- 'monthly' | 'quarterly' | 'yearly' | null (gratuito/cortesía)
  reference_price integer,                   -- precio referencial, nullable (no es fuente de facturación real)
  currency text default 'CLP',
  benefits jsonb not null default '[]',
  is_available boolean not null default true,   -- visible/ofrecible a nuevos usuarios
  status text not null default 'active',        -- 'active' | 'inactive'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table subscription_plans enable row level security;

create table if not exists subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id text not null references subscription_plans(id),
  status text not null default 'pending',   -- 'pending' | 'active' | 'canceled' | 'expired' | 'grace_period'
  provider text not null,                    -- 'google_play' | 'apple' | 'stripe' | 'flow' | 'mercadopago' | 'manual'
  provider_reference text,                   -- purchase token / subscription id del proveedor, nullable
  started_at timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_id_idx on subscriptions (user_id);
create index if not exists subscriptions_active_idx on subscriptions (user_id, status) where status in ('active', 'grace_period');
alter table subscriptions enable row level security;

create table if not exists subscription_events (
  id bigint generated always as identity primary key,
  subscription_id bigint references subscriptions(id) on delete set null,
  type text not null,                        -- 'purchase' | 'renewal' | 'cancellation' | 'expiration' | 'refund'
  provider text not null,
  raw_payload jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists subscription_events_subscription_id_idx on subscription_events (subscription_id);
alter table subscription_events enable row level security;

-- RLS: el usuario puede leer solo el ESTADO CALCULADO (vía la función del motor,
-- nunca estas tablas directo). Ninguna policy de select/insert/update para el rol
-- autenticado normal en ninguna de las 3 tablas — solo SUPABASE_SECRET_KEY escribe
-- y lee. Mismo patrón de "RLS como defensa en profundidad" que profiles/price_history.

-- profiles.plan pasa a ser cache derivado — ya no se escribe directo desde
-- ningún endpoint de cliente, solo desde subscriptionService.
```

**Por qué 3 tablas y no 1:** el catálogo (`subscription_plans`) cambia por decisión comercial, no técnica — nunca debe requerir un deploy de código para agregar un plan nuevo. `subscriptions` es el estado actual (una fila relevante por usuario activo). `subscription_events` es la bitácora inmutable — nunca se actualiza ni se borra, solo se inserta; es lo que permite reconstruir "qué pasó" ante cualquier disputa o bug, y es la aplicación literal del principio "los proveedores solo informan transacciones": cada notificación de un proveedor se guarda tal cual (`raw_payload`) antes de decidir qué hacer con ella.

**Por qué `plan_id` es `text` libre y no un enum:** un enum en Postgres requiere migración de esquema para agregar un valor nuevo — viola directamente el principio "los planes no deben quedar codificados". `subscription_plans.id` es la única fuente de verdad de qué planes existen.

### 3.2 Subscription Service (`api/src/services/subscriptionService.ts` + `api/src/lib/subscriptionsDb.ts`, nuevos)

Mismo patrón de degradación elegante que `priceHistoryDb.ts`/`medicationRegistry.ts`: si Supabase no responde, `getEntitlement` devuelve `{ active: false, plan: null }` en vez de lanzar — nunca rompe la app.

```typescript
// Contrato funcional propuesto — no código final

interface Entitlement {
  active: boolean;
  planId: string | null;
  benefits: string[];
  expiresAt: string | null;
}

// La ÚNICA función que cualquier cliente (web hoy, mobile a futuro) debe llamar
// para saber si alguien tiene Premium. Nunca se pregunta al proveedor en vivo.
async function getEntitlement(userId: string): Promise<Entitlement>;

// Punto de entrada de CUALQUIER adaptador de proveedor — normaliza y persiste.
async function recordProviderEvent(event: NormalizedSubscriptionEvent): Promise<void>;

// Reemplaza el write directo de profilesAdmin.setProfilePlan — crea una
// suscripción real con provider='manual', no un update de columna.
async function grantManual(userId: string, planId: string, expiresAt?: string): Promise<void>;
```

### 3.3 Adaptadores de proveedor

```typescript
interface NormalizedSubscriptionEvent {
  provider: "google_play" | "apple" | "stripe" | "flow" | "mercadopago" | "manual";
  providerReference: string;
  type: "purchase" | "renewal" | "cancellation" | "expiration" | "refund";
  userId: string;       // resuelto por el adaptador (ver R-02)
  planId: string;
  periodEnd: string | null;
  rawPayload: unknown;
}

interface PaymentProviderAdapter {
  parseNotification(payload: unknown): NormalizedSubscriptionEvent | null;
}
```

Fase 1 implementa **solo** `googlePlayAdapter` (`api/src/lib/adapters/googlePlayAdapter.ts`), vía Real-Time Developer Notifications (Google Cloud Pub/Sub → push HTTP) o verificación directa de purchase token contra la Play Developer API. Requiere una Service Account de Google Cloud con acceso a esa API — no existe hoy, se crea bajo `mario.lillo.alfaro@gmail.com` (ver ADR-0002).

### 3.4 API

Para no superar el límite de 12 funciones serverless de Vercel (hoy 9/12), todo se consolida en **una función nueva**, mismo patrón que `alerts.ts` de Sprint C:

- `api/api/subscriptions.ts` → delega a `api/src/routes/subscriptions.ts`, dispatch por `action`:
  - `action=me` (`GET`, requiere sesión) → `getEntitlement(userId)`.
  - `action=google-rtdn` (`POST`, autenticado por la firma/token de Google Pub/Sub, no por `API_SECRET_KEY`) → adaptador de Google Play → `recordProviderEvent`.
  - `action=verify-purchase` (`POST`, requiere sesión) → para cuando `mobile/` pueda enviar un purchase token tras una compra real.

Quedaría en 10/12 funciones.

### 3.5 Dónde vive el código

- **`packages/domain`**: cero cambios. El motor de suscripciones no es parte del dominio de búsqueda/precios, vive enteramente en `api/`.
- **`api/src/lib/subscriptionsDb.ts`** (nuevo): acceso a datos, degradación elegante.
- **`api/src/services/subscriptionService.ts`** (nuevo): `getEntitlement`, `recordProviderEvent`, `grantManual`.
- **`api/src/lib/adapters/googlePlayAdapter.ts`** (nuevo): único adaptador de Fase 1.
- **`api/src/routes/subscriptions.ts`** + **`api/api/subscriptions.ts`** (nuevos): API HTTP.
- **`web/src/lib/profilesAdmin.ts`**: `setProfilePlan` deja de hacer `update` directo, pasa a llamar `grantManual` del motor.
- **`web/src/lib/profile.ts`**: `getCurrentProfile()` deja de leer `profiles.plan` directo, pasa a consultar `getEntitlement`.
- **`mobile/`**: cero cambios en esta fase (congelado).

---

## 4. Compatibilidad

| Aspecto | Estado |
|---|---|
| `profiles.plan` | Sigue existiendo como cache derivado — cualquier código que ya lo lea sigue funcionando sin cambios inmediatos, pero deja de ser la fuente de verdad. |
| `/admin/usuarios` (UI) | Sin cambios visibles — el botón "Hacer premium" sigue ahí, pero por debajo llama a `grantManual` en vez de `update profiles`. |
| `mobile/` | Cero cambios de código, cero build nuevo. |
| API pública (`/api/search`, etc.) | Sin cambios — este RFC no toca el pipeline de búsqueda. |

---

## 5. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **R-01 — `mobile/` congelado impide verificar el flujo de compra real end-to-end** | Alta (es una restricción activa conocida) | Medio — Fase 1 queda "completa a nivel backend" pero no probada con una compra real de Google Play | Verificar con Google Play sandbox/test track sin publicar en `mobile/`; documentar explícitamente como deuda pendiente hasta que `mobile/` salga de Prueba Cerrada |
| **R-02 — Resolver qué usuario corresponde a una notificación de Google Play** | Media | Alto — una notificación RTDN trae el purchase token, no el `user_id` de Supabase directamente | El purchase token debe asociarse al `user_id` en el momento de la compra (cuando `mobile/` pueda enviarlo) vía `action=verify-purchase`; sin eso, las notificaciones RTDN no tienen forma de mapearse a un usuario — **este es el motivo por el que Fase 1 no puede cerrar el ciclo completo sin `mobile/`** |
| **R-03 — Exposición de datos sensibles (purchase tokens, payloads crudos)** | Baja si se sigue el diseño | Alto si se expone | `subscription_events.raw_payload` nunca se expone vía API — mismo patrón RLS que `profiles` (solo `SUPABASE_SECRET_KEY` lee/escribe las 3 tablas nuevas) |
| **R-04 — Límite de funciones serverless de Vercel (12 máx.)** | Baja | Bajo | Consolidado en 1 función nueva (`subscriptions.ts`), igual que Sprint C — queda en 10/12 |
| **R-05 — Credencial nueva de Google Cloud (Service Account) no existe** | Alta (es un hecho conocido, no una incertidumbre) | Bajo | Se crea bajo `mario.lillo.alfaro@gmail.com` (ver ADR-0002) — no bloquea el diseño, sí bloquea la verificación end-to-end hasta que se cree |

---

## 6. Restricción activa: `mobile/`

Esta fase se implementa **enteramente dentro de `api/`**, sin ningún cambio en `mobile/src/**` — consistente con la restricción activa documentada en `CLAUDE.md` (app en Prueba Cerrada de Google Play). El flujo de compra iniciado desde la app (Play Billing Library) y el envío del purchase token al backend quedan explícitamente fuera de alcance de esta fase, y se retoman cuando `mobile/` salga de Prueba Cerrada.

---

## 7. Plan de Implementación (mapeado a issues)

| Issue | Alcance |
|---|---|
| CF-112 | Modelo de datos: `subscription_plans`, `subscriptions`, `subscription_events` en `docs/technology/database/schema.sql` |
| CF-113 | `subscriptionService.ts` + `subscriptionsDb.ts`: `getEntitlement`, `recordProviderEvent`, `grantManual`, con tests |
| CF-114 | Adaptador Google Play (`googlePlayAdapter.ts`) — solo parsing/verificación server-side, sin tocar `mobile/` |
| CF-115 | API consolidada `api/api/subscriptions.ts` + `api/src/routes/subscriptions.ts` |
| CF-116 | Migrar `web/src/lib/profilesAdmin.ts` (`setProfilePlan` → `grantManual`) y `web/src/lib/profile.ts` (`getCurrentProfile` → `getEntitlement`) al nuevo motor |

---

## 8. Definition of Done

- [ ] `subscription_plans`, `subscriptions`, `subscription_events` existen en Supabase y en `docs/technology/database/schema.sql`
- [ ] `subscriptionService.getEntitlement()` funciona con Supabase ausente (degradación elegante, nunca lanza)
- [ ] Adaptador de Google Play parsea una notificación RTDN de prueba (sandbox) correctamente
- [ ] `api/api/subscriptions.ts` responde `action=me`, `action=google-rtdn`, `action=verify-purchase`
- [ ] `/admin/usuarios` sigue funcionando igual, ahora vía `grantManual`
- [ ] `web/src/lib/profile.ts` consulta el motor, no `profiles.plan` directo
- [ ] Cero cambios en `mobile/src/**` y en `packages/domain`
- [ ] `pnpm typecheck` y tests de `api/`/`web/` en verde

---

## 9. Recomendación Final

**¿Se recomienda implementar Fase 1?** Sí, con prioridad media (CFPS 3.0) — condicionado a que el CEO ratifique el score antes de generar el prompt de sprint. El diseño es aditivo (no rompe nada de Sprint C/D/E), no toca `mobile/`, y el riesgo principal (R-01/R-02) es un bloqueo de *verificación completa*, no de *diseño* — el motor puede construirse y probarse con datos manuales/sandbox hoy, y el cierre end-to-end queda documentado como dependencia externa (salida de Prueba Cerrada), no como parte pendiente de este RFC.
