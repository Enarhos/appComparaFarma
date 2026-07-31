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
