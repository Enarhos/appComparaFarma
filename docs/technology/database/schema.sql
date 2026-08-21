-- ComparaFarma — esquema de Supabase (Postgres)
--
-- No hay migraciones automatizadas (sin Supabase CLI ni herramienta de
-- migraciones): las tablas se crean a mano en el SQL Editor de Supabase.
-- Este archivo es la referencia de qué se corrió — mantenerlo al día cada
-- vez que se agregue o cambie una tabla, para no depender de memoria/chat.
--
-- Todo usa "if not exists" a propósito: correr el script completo de nuevo
-- (por ejemplo tras agregar una tabla nueva al final) es seguro, no toca las
-- tablas ya existentes.

-- ============================================================
-- Fase 1 (2026-07-20) — ya aplicado en producción.
-- Reconstruido a partir de api/src/lib/priceHistoryDb.ts y clickTracking.ts;
-- si difiere del Table Editor real, ese es el que manda — actualizar acá.
-- ============================================================

create table if not exists price_history (
  id bigint generated always as identity primary key,
  match_key text not null,
  canonical_name text,
  pharmacy_slug text not null,
  store_price integer,
  effective_price integer,
  channels jsonb not null default '[]',
  recorded_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (match_key, pharmacy_slug, recorded_date)
);
alter table price_history enable row level security;

create table if not exists pharmacy_clicks (
  id bigint generated always as identity primary key,
  match_key text not null,
  pharmacy_slug text not null,
  clicked_at timestamptz not null default now()
);
alter table pharmacy_clicks enable row level security;

-- ============================================================
-- Fase 3 (2026-07-20) — panel /admin: config genérico + bandeja de feedback.
-- Estas dos SÍ son nuevas — correr esta sección en el SQL Editor de Supabase.
-- ============================================================

create table if not exists app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table app_config enable row level security;

create table if not exists feedback (
  id bigint generated always as identity primary key,
  message text not null,
  email text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
alter table feedback enable row level security;

-- Ninguna de las cuatro tablas tiene policies de RLS permisivas — solo
-- api/ y web/ acceden, con SUPABASE_SECRET_KEY (bypassea RLS por diseño).
-- RLS queda habilitado como defensa en profundidad, no como mecanismo de
-- acceso real.

-- ============================================================
-- Sprint Web 1 (2026-07-27) — GET /api/price-history.
-- Índice aditivo, sin cambio de modelo: la ficha de medicamento consulta
-- price_history filtrando por match_key y un rango de recorded_date en cada
-- carga. Sin este índice, esa consulta escanea la tabla completa a medida
-- que crece; el índice único ya existente (match_key, pharmacy_slug,
-- recorded_date) no cubre bien un filtro que no fija pharmacy_slug.
-- ============================================================

create index if not exists price_history_match_key_recorded_date_idx
  on price_history (match_key, recorded_date);

-- ============================================================
-- Sprint A (2026-07-31) — RFC-002: Canonical Medication Registry (CFM-ID).
-- docs/engineering/rfc/RFC-002_CANONICAL_MEDICATION_REGISTRY.md
--
-- Identidad permanente por medicamento, independiente de matchKey (que ya
-- cambió 10 veces — ver docs/normalization.md §5). matchKey sigue siendo el
-- único mecanismo de fusión de resultados; esta tabla solo traduce
-- match_key -> cfm_id para dar continuidad histórica a price_history,
-- pharmacy_clicks, alertas y favoritos aunque el algoritmo de matching
-- cambie de nuevo en el futuro.
--
-- ⚠️ Correr esta sección a mano en el SQL Editor de Supabase antes de
-- desplegar el código de la Fase 4 (api/src/services/searchService.ts ya
-- llama attachCanonicalIds()) — si las tablas no existen todavía, el
-- sistema sigue funcionando igual que hoy (cfmId: null en todos los
-- resultados), no se rompe nada, pero el registro no arranca hasta correr
-- esto.
-- ============================================================

create sequence if not exists medications_cfm_seq;

create table if not exists medications (
  cfm_id text primary key
    default ('CFM-' || lpad(nextval('medications_cfm_seq')::text, 6, '0')),
  canonical_name text not null,
  laboratory text,
  is_bioequivalent boolean,
  match_key_current text not null,
  status text not null default 'active',        -- 'active' | 'merged' | 'deprecated'
  merged_into_cfm_id text references medications(cfm_id),
  source text not null default 'auto',           -- 'auto' | 'curated'
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  notes text
);
alter table medications enable row level security;

create table if not exists medication_match_key_aliases (
  match_key text primary key,
  cfm_id text not null references medications(cfm_id),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists idx_medication_aliases_cfm_id
  on medication_match_key_aliases(cfm_id);
alter table medication_match_key_aliases enable row level security;

-- Columnas aditivas en tablas existentes — nullable, no rompen nada.
alter table price_history add column if not exists cfm_id text references medications(cfm_id);
alter table pharmacy_clicks add column if not exists cfm_id text references medications(cfm_id);

-- ============================================================
-- Sprint C (2026-07-31) — Alertas de precio por email en web/.
-- docs/prompt/claude/PROMPT_CLAUDE_SPRINT_C_ALERTAS_EMAIL.md
--
-- Sin cuenta de usuario: el email se captura al crear la alerta, y toda
-- la gestión (confirmar / cancelar) es vía el `token` en la URL, no vía
-- sesión. El token se genera en código (crypto.randomUUID()) al insertar,
-- no en la base — evita depender de una extensión de Postgres.
--
-- Flujo de estados: pending -> active -> triggered (terminal, una sola
-- notificación por alerta) | unsubscribed (terminal, desde pending o
-- active).
-- ============================================================

create table if not exists email_alerts (
  id bigint generated always as identity primary key,
  email text not null,
  match_key text not null,
  canonical_name text not null,
  target_price integer not null,
  status text not null default 'pending', -- 'pending' | 'active' | 'triggered' | 'unsubscribed'
  token text not null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  last_checked_at timestamptz,
  triggered_at timestamptz,
  triggered_price integer
);
create unique index if not exists email_alerts_token_idx on email_alerts (token);
create index if not exists email_alerts_active_idx on email_alerts (status) where status = 'active';
alter table email_alerts enable row level security;

-- ============================================================
-- Sprint D (2026-08-02) — Cuenta ligera + perfil de usuario en web/.
-- docs/prompt/claude/PROMPT_CLAUDE_SPRINT_D_CUENTA_LIGERA.md
--
-- Extiende auth.users (ya provista por Supabase Auth, usada hoy solo
-- por /admin) con una tabla de perfil propia. El campo `plan` es el
-- habilitante para gatear funcionalidades futuras (todavía no gatea
-- nada existente) — sin flujo de pago en este sprint, el plan se
-- activa a mano desde /admin/usuarios.
--
-- El usuario puede LEER su propio perfil (policy de select), pero NO
-- puede escribirlo — no hay policy de insert/update para el rol
-- autenticado normal, así que un usuario no puede auto-asignarse
-- premium. Solo admin.ts (SUPABASE_SECRET_KEY, bypassea RLS) escribe.
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'free', -- 'free' | 'premium'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_plan_idx on profiles (plan);
alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

-- Crea automáticamente la fila de perfil (plan free) cuando alguien se
-- registra vía Supabase Auth — security definer porque el usuario que
-- dispara el trigger todavía no tiene permiso propio de insert.
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_profile();

-- ============================================================
-- Subscription Platform — Fase 1 (2026-08-02) — RFC-003, ADR-0002, CF-112.
-- docs/engineering/rfc/RFC-003_SUBSCRIPTION_ENGINE.md
--
-- Reemplaza profiles.plan como fuente de verdad del estado Premium.
-- profiles.plan se mantiene como cache derivado (actualizado solo por
-- subscriptionService, nunca por un endpoint de cliente directo) —
-- ver CF-116.
--
-- Ninguna de las 3 tablas tiene policies de RLS permisivas para el rol
-- autenticado — mismo patrón que profiles/price_history: solo api/
-- (SUPABASE_SECRET_KEY, bypassea RLS) lee y escribe. Un usuario nunca
-- lee subscriptions/subscription_events directo, siempre a través de
-- getEntitlement() (que no expone raw_payload ni columnas internas).
-- ============================================================

-- Catálogo de planes — configurable, nunca hardcodeado en TypeScript.
-- La existencia y el precio de cada plan es una decisión comercial que
-- se resuelve con una fila acá, no con un deploy de código.
create table if not exists subscription_plans (
  id text primary key,                          -- código estable, ej. 'premium_monthly', 'cortesia'
  name text not null,
  product_type text not null default 'app',     -- 'app' | 'family' | 'business' | 'api' | 'other'
  billing_period text,                          -- 'monthly' | 'quarterly' | 'yearly' | null (gratuito/cortesía)
  reference_price integer,                      -- precio referencial, nullable — no es fuente de facturación real
  currency text not null default 'CLP',
  benefits jsonb not null default '[]',
  is_available boolean not null default true,   -- visible/ofrecible a nuevos usuarios
  status text not null default 'active',        -- 'active' | 'inactive'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table subscription_plans enable row level security;

-- Estado actual de suscripción por usuario. Un usuario puede tener
-- múltiples filas a lo largo del tiempo (histórico), pero a lo sumo
-- una relevante en estado 'active'/'grace_period' por vez (no forzado
-- por constraint de DB — lo garantiza subscriptionService).
create table if not exists subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id text not null references subscription_plans(id),
  status text not null default 'pending',       -- 'pending' | 'active' | 'canceled' | 'expired' | 'grace_period'
  provider text not null,                       -- 'google_play' | 'apple' | 'stripe' | 'flow' | 'mercadopago' | 'manual'
  provider_reference text,                      -- purchase token / subscription id del proveedor, nullable
  started_at timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_id_idx on subscriptions (user_id);
create index if not exists subscriptions_active_idx
  on subscriptions (user_id, status) where status in ('active', 'grace_period');
alter table subscriptions enable row level security;

-- Bitácora inmutable — nunca se actualiza ni se borra, solo se inserta.
-- Es la aplicación literal de "los proveedores solo informan
-- transacciones": cada notificación se guarda tal cual (raw_payload)
-- antes de decidir qué hacer con ella. Da trazabilidad completa ante
-- cualquier disputa o bug de facturación.
create table if not exists subscription_events (
  id bigint generated always as identity primary key,
  subscription_id bigint references subscriptions(id) on delete set null,
  type text not null,                           -- 'purchase' | 'renewal' | 'cancellation' | 'expiration' | 'refund'
  provider text not null,
  raw_payload jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists subscription_events_subscription_id_idx
  on subscription_events (subscription_id);
alter table subscription_events enable row level security;

-- Plan placeholder para el mecanismo de otorgamiento manual (/admin/usuarios,
-- CF-116) — NO es un plan comercial (is_available=false, no se ofrece ni se
-- vende). Existe solo para que subscriptionService.grantManual() tenga un
-- plan_id válido contra el que insertar (subscriptions.plan_id tiene FK a
-- subscription_plans). El catálogo comercial real (mensual, anual, familiar,
-- etc.) queda vacío hasta que el CEO lo defina — no se hardcodea acá.
insert into subscription_plans (id, name, product_type, billing_period, reference_price, currency, benefits, is_available, status)
values ('cortesia', 'Cortesía (otorgado manualmente)', 'app', null, null, 'CLP', '["premium"]'::jsonb, false, 'active')
on conflict (id) do nothing;

-- ============================================================
-- Subscription Platform — Fase 2 (2026-08-02) — RFC-004, ADR-0003, CF-117.
-- docs/engineering/rfc/RFC-004_WEB_BILLING_STRIPE.md
--
-- Mapeo al Price de Stripe correspondiente a cada plan. Nullable: un plan
-- puede existir en el catálogo (ej. 'cortesia') sin ser vendible por Stripe.
-- El catálogo comercial real (mensual, anual, familiar, etc.) sigue vacío
-- hasta que el CEO lo defina — crear un plan vendible es insertar una fila
-- con is_available=true y este campo apuntando a un Price real de Stripe,
-- nunca requiere un deploy de código (ver CF-121).
-- ============================================================

alter table subscription_plans add column if not exists stripe_price_id text;

-- ============================================================
-- Subscription Platform — Fase 2 corregida (2026-08-02/03) — RFC-005, ADR-0004, CF-122.
-- docs/engineering/rfc/RFC-005_WEB_BILLING_FLOW.md
--
-- Stripe no admite comercios domiciliados en Chile (verificado oficialmente
-- al intentar crear la cuenta real) — se retira la columna que la Fase 2
-- original había agregado. No se reemplaza por un "flow_price_id": Flow
-- permite elegir el planId nosotros mismos (a diferencia de Stripe, que
-- genera sus propios IDs de Price), así que se reutiliza
-- subscription_plans.id directo como planId de Flow.
-- ============================================================

alter table subscription_plans drop column if exists stripe_price_id;

-- Identidad de Flow por usuario — independiente de cualquier suscripción,
-- porque en Flow un cliente se crea y enrola tarjeta ANTES de que exista
-- una suscripción (a diferencia de Stripe Checkout, que resolvía todo en
-- un solo paso). register_status permite detectar un alta a medio camino
-- (cliente creado, tarjeta todavía no confirmada).
--
-- Mismo patrón de RLS que subscriptions/subscription_events: sin policies
-- para el rol autenticado — solo api/ (SUPABASE_SECRET_KEY) lee y escribe.
create table if not exists flow_customers (
  user_id uuid primary key references profiles(id) on delete cascade,
  flow_customer_id text not null unique,
  register_status text not null default 'pending', -- 'pending' | 'active'
  card_brand text,
  card_last4 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table flow_customers enable row level security;

-- ============================================================
-- Account Deletion — AUTH-DELETE-01 (2026-08-21, hardened 2026-08-21) —
-- GATE_3_AUTH_DELETE_01 + GATE_INFRA_HARDENING (informes de diseño + gates
-- CTO). Resuelve USER_DOMAIN_MODEL.md, Decisión Pendiente #5 ("Retención
-- tras dejar de ser Usuario").
--
-- ⚠️ NO EJECUTADO TODAVÍA EN PRODUCCIÓN — correr este bloque completo, tal
-- cual (una sola transacción, no por partes), en el SQL Editor de Supabase
-- antes de desplegar api/src/routes/account.ts. Es CODE_READY, no
-- CONFIG_READY/DEPLOYED (ver CLAUDE.md §6) hasta que alguien con acceso al
-- proyecto lo corra y lo confirme.
--
-- Reemplaza el draft original (2026-08-21) — aquel no incluía los
-- revoke/grant de esta sección y quedaba, por defaults de Postgres/Supabase,
-- ejecutable directamente por anon/authenticated vía `rpc/delete_account_data`
-- con solo el anon key, sin pasar por account.ts ni por JWT/reautenticación
-- (hallazgo de la auditoría de infraestructura previa). No se conserva ese
-- draft en el repo — este bloque es la única versión vigente.
--
-- Todo el bloque corre dentro de una sola transacción: la tabla, la función
-- y sus revoke/grant se crean atómicamente. Ninguna otra conexión puede ver
-- un estado intermedio en el que la función exista sin sus revokes — antes
-- del COMMIT no es visible para nadie más; después del COMMIT ya está
-- endurecida. No existe una ventana donde quede expuesta a PUBLIC.
--
-- `account_deletion_requests` — control transitorio del ciclo de vida
-- ACTIVE -> DELETION_PENDING -> DELETED. No es un histórico de cuentas
-- eliminadas: una eliminación exitosa BORRA su propia fila de control (ver
-- accountDeletionDb.ts) — nunca queda un registro personal permanente
-- después del cierre (Ley 21.719 — no conservar "por si acaso").
-- ============================================================

begin;

create table if not exists public.account_deletion_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  email text not null,
  status text not null default 'pending', -- 'pending' es el único valor vigente: el éxito borra la fila, no la marca 'completed'.
  requested_at timestamptz not null default now(),
  last_attempt_at timestamptz not null default now(),
  last_error text,
  steps_completed jsonb not null default '[]'
);

create unique index if not exists account_deletion_requests_user_id_idx
  on public.account_deletion_requests (user_id);

alter table public.account_deletion_requests enable row level security;
-- Sin policies para el rol autenticado — mismo patrón que subscriptions/
-- flow_customers: solo api/ (SUPABASE_SECRET_KEY -> service_role) lee y
-- escribe. Los revoke explícitos de abajo son defensa en profundidad: no
-- dependen únicamente de "no hay policy" para negar acceso a anon/authenticated.

-- `delete_account_data` — limpieza atómica de `public.*` para una cuenta.
-- Política activa (GATE 2, retención financiera): DELETE por defecto sobre
-- subscription_events — no existe en este repositorio ningún fundamento
-- legal/tributario documentado que justifique conservar `raw_payload`, así
-- que se elimina junto con el resto (a diferencia del `on delete set null`
-- de la FK, que solo protege contra un cascade accidental por otras vías,
-- no expresa una decisión de retención). Si en el futuro se documenta un
-- fundamento real (ver GATE_3_AUTH_DELETE_01_REPORT.md, sección
-- OPEN_LEGAL_QUESTIONS), este es el único lugar que habría que cambiar.
--
-- Nunca toca price_history, pharmacy_clicks, medications,
-- medication_match_key_aliases, subscription_plans ni app_config —
-- principio rector: "eliminar identidad personal, preservar inteligencia
-- farmacéutica no personal." (ver accountDeletionSql.test.ts, que audita
-- este texto para garantizarlo).
--
-- SECURITY DEFINER + search_path fijado a `public` (mitiga search_path
-- hijacking) + referencias internas totalmente calificadas (`public.*`) —
-- hardening adicional que no cambia el comportamiento: aunque search_path
-- ya está fijado, calificar explícitamente cada tabla deja la función
-- correcta incluso si en el futuro alguien la recrea sin el `set
-- search_path` (defensa en profundidad, no una dependencia nueva).
create or replace function public.delete_account_data(p_user_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.subscription_events
    where subscription_id in (select id from public.subscriptions where user_id = p_user_id);
  delete from public.flow_customers where user_id = p_user_id;
  delete from public.subscriptions where user_id = p_user_id;
  delete from public.email_alerts where lower(email) = lower(p_email);
  delete from public.feedback where email is not null and lower(email) = lower(p_email);
  delete from public.profiles where id = p_user_id;
end;
$$;

-- ------------------------------------------------------------
-- Revoke/grant — cierra el hallazgo de la auditoría de infraestructura:
-- por default de Postgres, EXECUTE sobre una función nueva se concede a
-- PUBLIC (que en Supabase incluye a anon/authenticated); y por los default
-- privileges de este proyecto en el esquema `public`, una tabla nueva
-- también puede heredar privilegios amplios. Ninguno de los dos defaults es
-- aceptable para esta función/tabla: identidad y reautenticación las
-- resuelve exclusivamente api/src/routes/account.ts (JWT validado, nunca un
-- p_user_id/p_email que venga directo de un cliente) — el RPC no debe ser
-- una puerta lateral que la evite.
-- ------------------------------------------------------------

revoke execute on function public.delete_account_data(uuid, text) from public;
revoke execute on function public.delete_account_data(uuid, text) from anon;
revoke execute on function public.delete_account_data(uuid, text) from authenticated;
grant execute on function public.delete_account_data(uuid, text) to service_role;

revoke all on table public.account_deletion_requests from anon;
revoke all on table public.account_deletion_requests from authenticated;
grant all on table public.account_deletion_requests to service_role;

-- `id` es `generated always as identity`: Postgres crea una sequence
-- implícita propia de la columna (nombre determinístico
-- `account_deletion_requests_id_seq`). El privilegio sobre la tabla NO se
-- propaga automáticamente a esa sequence — son dos objetos de privilegios
-- independientes (mismo gotcha que las columnas `serial`): cualquier INSERT
-- que dependa del DEFAULT (`nextval()`) requiere que el rol que ejecuta el
-- INSERT tenga USAGE (o UPDATE) sobre la sequence, no solo sobre la tabla.
-- No se asume que los default privileges del proyecto ya cubren esto (es
-- precisamente el mismo mecanismo que dejó expuesta la función sin este
-- bloque) — se deja explícito y, por el mismo criterio de defensa en
-- profundidad, también se revoca de anon/authenticated.
revoke all on sequence public.account_deletion_requests_id_seq from anon;
revoke all on sequence public.account_deletion_requests_id_seq from authenticated;
grant usage, select on sequence public.account_deletion_requests_id_seq to service_role;

commit;
