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
