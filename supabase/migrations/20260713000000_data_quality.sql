-- Data-quality pass — lead with real destinations, preserve every row.
--
-- The ingested dataset is ~75% bare OpenStreetMap `natural=spring` points
-- (no description, no photo — just coordinates + a canned safety line). They
-- dilute the map. This migration is fully ADDITIVE and REVERSIBLE: it adds
-- flag/rank columns and never deletes a row. To fully revert:
--   alter table location
--     drop column display_hidden, drop column quality_score,
--     drop column hidden_reason, drop column name_original;
--   (and restore the prior locations_near body from 20260706000000_init.sql)

alter table location add column if not exists display_hidden boolean not null default false;
alter table location add column if not exists quality_score  smallint;
alter table location add column if not exists hidden_reason  text;
alter table location add column if not exists name_original  text;

-- R1 — hide bare springs (no description AND no photo). ~11,121 rows.
update location l
   set display_hidden = true, hidden_reason = 'bare_spring'
 where l.feature_type = 'spring'
   and (l.description is null or btrim(l.description) = '')
   and not exists (select 1 from location_media m where m.location_id = l.id)
   and l.display_hidden = false;
-- undo: update location set display_hidden=false, hidden_reason=null where hidden_reason='bare_spring';

-- R2 — quality_score for ranking: photo(3) + description(2) + verified(2) + live-conditions(1).
update location l set quality_score =
    (case when exists (select 1 from location_media m where m.location_id = l.id) then 3 else 0 end)
  + (case when l.description is not null and btrim(l.description) <> '' then 2 else 0 end)
  + (case when l.moderation_status = 'verified' then 2 else 0 end)
  + (case when l.condition_score is not null then 1 else 0 end);
-- undo: update location set quality_score = null;

-- R3 — collapse exact-coordinate duplicates; keep the most-curated per (lat,lng). ~20 rows.
with ranked as (
  select id, row_number() over (
    partition by lat, lng
    order by (moderation_status = 'verified') desc,
             exists (select 1 from location_media m where m.location_id = location.id) desc,
             (description is not null and btrim(description) <> '') desc,
             created_at asc) as rn
    from location
)
update location set display_hidden = true, hidden_reason = 'dup_exact_coord'
 where id in (select id from ranked where rn > 1) and display_hidden = false;
-- undo: update location set display_hidden=false, hidden_reason=null where hidden_reason='dup_exact_coord';

-- R5 — fix the 4 genuinely junk names (wrapped quotes, ';'-delimited alt names,
-- trailing zero-width chars). Back up originals. Do NOT touch the 142 legitimate
-- apostrophes or the accented/indigenous names.
update location set name_original = name
 where (name ~ '^".*"$' or name like '%;%'
        or name <> btrim(name, E' \t\n\r' || chr(160) || chr(8203) || chr(65279)))
   and name_original is null;
update location set name = btrim(btrim(name), '"')           where name ~ '^".*"$';
update location set name = btrim(split_part(name, ';', 1))   where name like '%;%';
update location set name = btrim(name, E' \t\n\r' || chr(160) || chr(8203) || chr(65279))
 where name <> btrim(name, E' \t\n\r' || chr(160) || chr(8203) || chr(65279));
-- undo: update location set name = name_original where name_original is not null;

-- Nearest-neighbour RPC also excludes hidden rows so "Nearest" leads with destinations.
create or replace function locations_near(
  p_lat double precision, p_lng double precision,
  p_radius_m double precision, p_limit integer default 50
) returns table (
  id uuid, slug text, name text, feature_type feature_type,
  lat double precision, lng double precision,
  difficulty_tier difficulty_tier, access_type access_type,
  moderation_status moderation_status, distance_m double precision
) language sql stable as $$
  select l.id, l.slug, l.name, l.feature_type, l.lat, l.lng,
         l.difficulty_tier, l.access_type, l.moderation_status,
         st_distance(l.geog, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) as distance_m
  from location l
  where l.moderation_status in ('verified', 'community')
    and l.display_hidden = false
    and st_dwithin(l.geog, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_m)
  order by distance_m
  limit p_limit;
$$;

-- Helps the display_hidden=false filter the app now applies on every list/map read.
create index if not exists location_display_hidden_idx on location (display_hidden);
