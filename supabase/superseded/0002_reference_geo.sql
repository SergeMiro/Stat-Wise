-- StatWise — geography and source catalogue (§10.3, §10.4)

-- Communes -----------------------------------------------------------------
create table if not exists reference.geo_communes (
  id uuid primary key default gen_random_uuid(),
  insee_code text unique not null,
  name text not null,
  normalized_name text not null,
  postal_codes text[],
  department_code text,
  region_code text,
  population integer,
  geometry geometry(MultiPolygon, 4326),
  centroid geometry(Point, 4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists geo_communes_geometry_gix on reference.geo_communes using gist (geometry);
create index if not exists geo_communes_centroid_gix on reference.geo_communes using gist (centroid);
create index if not exists geo_communes_insee_idx on reference.geo_communes (insee_code);
create index if not exists geo_communes_name_trgm on reference.geo_communes using gin (normalized_name gin_trgm_ops);

-- IRIS (intra-city analysed areas) -----------------------------------------
create table if not exists reference.geo_iris (
  id uuid primary key default gen_random_uuid(),
  iris_code text unique not null,
  commune_id uuid references reference.geo_communes(id) on delete cascade,
  name text,
  area_type text,
  population integer,
  geometry geometry(MultiPolygon, 4326) not null,
  centroid geometry(Point, 4326) not null,
  data_coverage_score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists geo_iris_geometry_gix on reference.geo_iris using gist (geometry);
create index if not exists geo_iris_centroid_gix on reference.geo_iris using gist (centroid);
create index if not exists geo_iris_commune_idx on reference.geo_iris (commune_id);
create index if not exists geo_iris_code_idx on reference.geo_iris (iris_code);

-- Source catalogue ---------------------------------------------------------
create table if not exists reference.data_sources (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  publisher text not null,
  source_url text not null,
  license text,
  refresh_frequency text,
  geographic_level text[] not null,
  legal_notes text,
  is_active boolean not null default true,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reference.metric_definitions (
  id uuid primary key default gen_random_uuid(),
  metric_code text unique not null,
  label_fr text not null,
  label_en text not null,
  description_fr text not null,
  description_en text not null,
  unit text not null,
  direction text not null check (direction in ('higher_is_better', 'lower_is_better', 'neutral', 'contextual')),
  calculation_method text not null,
  minimum_coverage_required numeric,
  expected_geographic_level text[] not null,
  source_id uuid references reference.data_sources(id),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Points of interest -------------------------------------------------------
create table if not exists reference.points_of_interest (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references reference.data_sources(id),
  external_id text,
  category text not null,
  subcategory text,
  name text,
  commune_id uuid references reference.geo_communes(id),
  iris_id uuid references reference.geo_iris(id),
  geometry geometry(Point, 4326) not null,
  metadata jsonb not null default '{}',
  source_updated_at timestamptz,
  imported_at timestamptz not null default now()
);

create index if not exists poi_geometry_gix on reference.points_of_interest using gist (geometry);
create index if not exists poi_commune_idx on reference.points_of_interest (commune_id);
create index if not exists poi_iris_idx on reference.points_of_interest (iris_id);
create index if not exists poi_category_idx on reference.points_of_interest (category, subcategory);
create unique index if not exists poi_source_external_uidx
  on reference.points_of_interest (source_id, external_id)
  where external_id is not null;
