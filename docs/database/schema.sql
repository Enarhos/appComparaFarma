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
