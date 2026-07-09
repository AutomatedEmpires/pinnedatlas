-- Live "Conditions" (Go Score) storage on each location. Populated by the
-- /api/cron/conditions job from the Conditions Engine (streamflow + weather +
-- season). The detail page computes conditions live; these columns power the
-- instant map/list "Right Now" surfacing.

alter table location
  add column if not exists condition_score smallint,
  add column if not exists condition_verdict text,
  add column if not exists condition_flow_pct smallint,
  add column if not exists condition_headline text,
  add column if not exists condition_updated_at timestamptz;

-- Cron picks the stalest conditions-relevant spots first.
create index if not exists location_condition_stale_idx
  on location (condition_updated_at nulls first)
  where feature_type in ('waterfall', 'hot_spring');
