-- PinnedAtlas initial schema: canonical location object, community reports,
-- per-user state, and webhook-synced subscriptions. PostGIS for geospatial.

create extension if not exists postgis;

-- Controlled dictionaries as enums (never free text)
create type feature_type as enum ('cave', 'waterfall', 'hot_spring', 'spring', 'other');
create type difficulty_tier as enum ('easy', 'moderate', 'hard', 'technical');
create type access_type as enum ('public_land', 'private_land_permission_required', 'unclear');
create type moderation_status as enum ('verified', 'community', 'pending', 'rejected');
create type source_type as enum ('osm', 'usgs', 'nps', 'wikidata', 'user_submitted');
create type report_type as enum (
  'condition_update', 'closure', 'incorrect_info', 'hazard', 'flowing_status', 'crowd_level'
);

-- One canonical location object drives map, detail, search, submission, moderation.
create table location (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  feature_type feature_type not null,
  lat double precision not null,
  lng double precision not null,
  geog geography(point, 4326) not null,
  elevation_m integer,
  description text,
  difficulty_tier difficulty_tier not null default 'moderate',
  difficulty_notes text,
  access_type access_type not null default 'unclear',
  season_notes text,
  hazard_notes text,
  source source_type not null,
  source_ref text,
  state_code text,
  moderation_status moderation_status not null default 'pending',
  submitted_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index location_geog_idx on location using gist (geog);
create index location_feature_type_idx on location (feature_type);
create index location_moderation_status_idx on location (moderation_status);
create index location_state_code_idx on location (state_code);
create index location_lat_lng_idx on location (lat, lng);
-- Idempotent ingestion: one row per upstream source record. NULL source_refs
-- (user submissions) are distinct under a unique index, so no predicate —
-- this also keeps ON CONFLICT (source, source_ref) usable from PostgREST.
create unique index location_source_ref_idx on location (source, source_ref);

create table location_media (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references location (id) on delete cascade,
  url text not null,
  credit text,
  uploaded_by text,
  moderation_status moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index location_media_location_idx on location_media (location_id);

create table location_report (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references location (id) on delete cascade,
  user_id text,
  report_type report_type not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index location_report_location_idx on location_report (location_id, created_at desc);

-- Per-user state lives here, never on location.
create table user_location_state (
  user_id text not null,
  location_id uuid not null references location (id) on delete cascade,
  saved boolean not null default false,
  visited boolean not null default false,
  personal_note text,
  updated_at timestamptz not null default now(),
  primary key (user_id, location_id)
);

create index user_location_state_user_idx on user_location_state (user_id) where saved;

-- Synced from Stripe webhooks; the only source of truth for entitlements.
create table subscription (
  user_id text primary key,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'none',
  plan text not null default 'none',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index subscription_customer_idx on subscription (stripe_customer_id);

-- updated_at maintenance
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger location_updated_at before update on location
  for each row execute function set_updated_at();

-- Keep geog in sync with lat/lng on insert/update.
create or replace function sync_location_geog()
returns trigger
language plpgsql
as $$
begin
  new.geog = st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  return new;
end;
$$;

create trigger location_geog_sync before insert or update of lat, lng on location
  for each row execute function sync_location_geog();

-- Nearest-neighbor RPC used by /api/locations/near
create or replace function locations_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_m double precision,
  p_limit integer default 50
)
returns table (
  id uuid, slug text, name text, feature_type feature_type,
  lat double precision, lng double precision,
  difficulty_tier difficulty_tier, access_type access_type,
  moderation_status moderation_status, distance_m double precision
)
language sql
stable
as $$
  select
    l.id, l.slug, l.name, l.feature_type, l.lat, l.lng,
    l.difficulty_tier, l.access_type, l.moderation_status,
    st_distance(l.geog, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) as distance_m
  from location l
  where l.moderation_status in ('verified', 'community')
    and st_dwithin(l.geog, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_m)
  order by distance_m
  limit p_limit;
$$;

-- RLS: the app talks to the database through the service role with app-layer
-- auth (Clerk). These policies protect any direct anon/authenticated access.
alter table location enable row level security;
alter table location_media enable row level security;
alter table location_report enable row level security;
alter table user_location_state enable row level security;
alter table subscription enable row level security;

create policy location_public_read on location
  for select using (moderation_status in ('verified', 'community'));

create policy location_media_public_read on location_media
  for select using (moderation_status in ('verified', 'community'));

create policy location_report_public_read on location_report
  for select using (
    exists (
      select 1 from location l
      where l.id = location_report.location_id
        and l.moderation_status in ('verified', 'community')
    )
  );

-- No anon/authenticated write policies: all writes go through the service role
-- in API routes, where Clerk identity and entitlements are enforced.
