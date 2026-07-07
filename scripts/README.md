# PinnedAtlas geodata ingestion

Plain-Node (`.mjs`) scripts that populate the `location` table from public
geodata sources. They are **not** part of the Next.js build — run them directly
with Node 18+ (global `fetch` required) from the repo root.

## Requirements

- Node 18 or newer.
- The Supabase schema applied (`supabase/migrations/20260706000000_init.sql`).
- Credentials in `.env.local` at the repo root (or exported in the
  environment — `process.env` takes precedence over the file):

  ```
  NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<service role key>
  ```

  The service role key is required because ingested rows bypass RLS; never
  ship these scripts anywhere client-facing.

## Scripts

### 1. `ingest-overpass.mjs` — OpenStreetMap (primary source)

Queries the Overpass API per state for named `natural=cave_entrance`,
`waterway=waterfall`, and `natural=hot_spring` elements and upserts them with
`source='osm'`, `source_ref='<type>/<id>'`, `moderation_status='community'`.

```sh
node scripts/ingest-overpass.mjs                 # all 16 covered states
node scripts/ingest-overpass.mjs --states=CO,UT  # subset
node scripts/ingest-overpass.mjs --dry           # log counts only, no writes
```

Covered states: WA, OR, CA, ID, NV, UT, AZ, MT, WY, CO, NM, TX, AR, MO, TN, NC.

Behavior notes:

- Sequential per state with an 8s pause between queries (Overpass fair-use).
- Retries once after 30s on HTTP 429/504, then falls back from
  `overpass-api.de` to the `overpass.kumi.systems` mirror. A state that fails
  on both endpoints is logged and skipped; the run continues.
- Unnamed elements are skipped. Difficulty tier and hazard notes come from
  per-feature-type defaults in `ingest-lib.mjs`.
- Slugs are `slugify(name, state)`; collisions within a run get `-2`, `-3`, …

Expect a full run to take roughly 5–15 minutes depending on Overpass load.

### 2. `ingest-gnis.mjs` — USGS GNIS (supplement, best-effort)

Queries the USGS gaz-domestic search API for the `Falls`, `Cave`, and `Spring`
feature classes per state (`Spring` names matching /hot spring/i become
`hot_spring`). Rows get `source='usgs'`, `source_ref='gnis/<feature id>'`,
`moderation_status='community'`.

```sh
node scripts/ingest-gnis.mjs
node scripts/ingest-gnis.mjs --states=CO,UT
node scripts/ingest-gnis.mjs --dry
```

Behavior notes:

- **Run it after the Overpass script.** Each GNIS candidate is deduped against
  existing DB rows: anything within ~300 m that shares a feature type or a
  fuzzy-similar name is skipped, so OSM rows (which usually have better
  coordinates and tags) win.
- The gaz-domestic API is not formally documented. The script probes a few
  known parameter spellings and verifies the response shape at runtime; if the
  shape is unrecognized it logs a clear message and exits gracefully without
  touching the database.
- Requests are paced at 1.5 s apart. Candidate slugs are bulk-checked against
  existing DB slugs so cross-source name collisions get suffixed instead of
  failing on the unique slug index.

Expect a full run to take 15–60 minutes (per-candidate dedupe queries dominate;
springs are by far the largest class).

## Expected volumes

Rough orders of magnitude across the 16 covered states:

- OSM: ~10,000–25,000 named rows total (waterfalls and cave entrances dominate;
  named hot springs number in the high hundreds).
- GNIS: potentially tens of thousands more, dominated by the `Spring` class
  (GNIS has ~38k spring records nationwide); falls and caves each add a few
  thousand. Dedupe removes the overlap with OSM.

## Re-run safety (idempotency)

Both scripts upsert on the unique `(source, source_ref)` index, so re-running
updates existing rows in place instead of duplicating them. GNIS additionally
skips candidates already represented nearby in the DB. Moderation status is
(re)written as `community` on upsert — rows an admin has since marked
`verified` will revert on a re-run; treat re-ingestion as a bulk refresh, not a
surgical update.

## Licensing and attribution

- **OpenStreetMap data is © OpenStreetMap contributors and licensed under the
  ODbL (Open Database License).** Attribution is mandatory wherever the data is
  displayed — the app surfaces it on the `/about` page. Do not remove it. See
  https://www.openstreetmap.org/copyright.
- USGS GNIS data is US public domain; we still credit "USGS GNIS" via
  `SOURCE_LABELS` on location detail pages and `/about`.
