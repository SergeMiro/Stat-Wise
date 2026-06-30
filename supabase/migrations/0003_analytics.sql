-- StatWise — analytics aggregates and import logs (§10.4-10.6)

create table if not exists analytics.metric_values (
  id uuid primary key default gen_random_uuid(),
  area_type text not null,
  area_id uuid not null,
  metric_id uuid references reference.metric_definitions(id),
  value numeric,
  value_text text,
  year integer,
  period_start date,
  period_end date,
  source_version text not null,
  confidence_score numeric not null,
  coverage_score numeric not null,
  calculated_at timestamptz not null default now(),
  metadata jsonb not null default '{}',
  unique (area_type, area_id, metric_id, source_version, period_start, period_end)
);

create index if not exists metric_values_area_idx on analytics.metric_values (area_type, area_id);

create table if not exists analytics.housing_sale_aggregates (
  id uuid primary key default gen_random_uuid(),
  area_type text not null,
  area_id uuid not null,
  property_type text not null,
  surface_bucket text,
  rooms_bucket text,
  period_start date not null,
  period_end date not null,
  transaction_count integer not null,
  median_price_m2 numeric,
  p25_price_m2 numeric,
  p75_price_m2 numeric,
  median_sale_price numeric,
  confidence_score numeric not null,
  source_version text not null,
  created_at timestamptz not null default now()
);

create index if not exists housing_sale_area_idx on analytics.housing_sale_aggregates (area_type, area_id);

create table if not exists analytics.housing_rent_aggregates (
  id uuid primary key default gen_random_uuid(),
  area_type text not null,
  area_id uuid not null,
  property_type text,
  surface_bucket text,
  period_start date not null,
  period_end date not null,
  median_rent_m2 numeric,
  median_rent_month numeric,
  source_scope text not null,
  confidence_score numeric not null,
  source_version text not null,
  created_at timestamptz not null default now()
);

create index if not exists housing_rent_area_idx on analytics.housing_rent_aggregates (area_type, area_id);

create table if not exists analytics.import_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references reference.data_sources(id),
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed', 'partial', 'rolled_back')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_received integer,
  records_valid integer,
  records_rejected integer,
  source_version text,
  checksum text,
  error_log jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists import_runs_source_idx on analytics.import_runs (source_id, started_at desc);
