#!/usr/bin/env node
// OpenStreetMap ingestion via the Overpass API.
// Pulls named cave entrances, waterfalls, and hot springs for each covered
// state and upserts them into `location` on (source, source_ref).
//
// Usage:
//   node scripts/ingest-overpass.mjs                 # all covered states
//   node scripts/ingest-overpass.mjs --states=CO,UT  # subset
//   node scripts/ingest-overpass.mjs --dry           # log counts, no writes
//
// OSM data is ODbL-licensed and requires attribution (surfaced at /about).

import {
  FEATURE_DEFAULTS,
  STATES,
  batchUpsert,
  getClient,
  normalizeName,
  parseFlags,
  politeSleep,
  slugify,
  uniqueSlug,
} from './ingest-lib.mjs';

const PRIMARY_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const FALLBACK_ENDPOINT = 'https://overpass.kumi.systems/api/interpreter';
const BETWEEN_STATES_MS = 8000;
const RETRY_AFTER_MS = 30_000;
const USER_AGENT = 'PinnedAtlas-ingest/1.0 (geodata pipeline; respects Overpass usage policy)';

function buildQuery(state) {
  // `out center` uses body verbosity, so nodes carry lat/lon and tags while
  // ways/relations carry a computed center point.
  return [
    '[out:json][timeout:180];',
    `area["ISO3166-2"="US-${state}"][admin_level=4]->.a;`,
    '(',
    '  nwr[natural=cave_entrance](area.a);',
    '  nwr[waterway=waterfall](area.a);',
    '  nwr[natural=hot_spring](area.a);',
    '  nwr[natural=spring](area.a);',
    ');',
    'out center;',
  ].join('\n');
}

function requestOnce(endpoint, query) {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: `data=${encodeURIComponent(query)}`,
  });
}

/** Query one endpoint, retrying once after 30s on 429/504; fall back to the mirror. */
async function fetchOverpass(query, state) {
  for (const endpoint of [PRIMARY_ENDPOINT, FALLBACK_ENDPOINT]) {
    try {
      let res = await requestOnce(endpoint, query);
      if (res.status === 429 || res.status === 504) {
        console.warn(`[${state}] ${endpoint} returned ${res.status}; retrying in 30s`);
        await politeSleep(RETRY_AFTER_MS);
        res = await requestOnce(endpoint, query);
      }
      if (res.ok) return await res.json();
      console.warn(`[${state}] ${endpoint} failed with HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[${state}] ${endpoint} request error: ${err.message}`);
    }
  }
  throw new Error(`all Overpass endpoints failed for ${state}`);
}

function featureTypeFor(tags) {
  if (tags.natural === 'cave_entrance') return 'cave';
  // A spring tagged hot (natural=spring + hot_spring=yes, or natural=hot_spring)
  // is classified as a hot spring; all other springs are plain springs.
  if (tags.natural === 'hot_spring' || tags.hot_spring === 'yes') return 'hot_spring';
  if (tags.waterway === 'waterfall') return 'waterfall';
  if (tags.natural === 'spring') return 'spring';
  return null;
}

function accessTypeFor(tags) {
  if (tags.access === 'private') return 'private_land_permission_required';
  if (tags.access === 'yes' || tags.access === 'permissive' || tags.access === 'public') {
    return 'public_land';
  }
  return 'unclear';
}

/** Map one Overpass element to a `location` row, or null when unusable. */
function mapElement(el, state) {
  const tags = el.tags;
  if (!tags || !tags.name) return null;
  const featureType = featureTypeFor(tags);
  if (!featureType) return null;
  const lat = Number.isFinite(el.lat) ? el.lat : el.center?.lat;
  const lng = Number.isFinite(el.lon) ? el.lon : el.center?.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const elevation = Number.parseInt(tags.ele, 10);
  const defaults = FEATURE_DEFAULTS[featureType];
  return {
    name: normalizeName(tags.name),
    feature_type: featureType,
    lat,
    lng,
    elevation_m: Number.isFinite(elevation) ? elevation : null,
    description: tags.description ?? null,
    difficulty_tier: defaults.difficulty_tier,
    access_type: accessTypeFor(tags),
    hazard_notes: defaults.hazard_notes,
    source: 'osm',
    source_ref: `${el.type}/${el.id}`,
    state_code: state,
    moderation_status: 'community',
  };
}

async function main() {
  const flags = parseFlags();
  const states = flags.states?.length ? flags.states : STATES;
  const unknown = states.filter((s) => !STATES.includes(s));
  if (unknown.length) {
    console.warn(`States outside the default coverage list: ${unknown.join(', ')} (running anyway)`);
  }
  const client = flags.dry ? null : getClient();

  // Slug de-dupe across the whole run: same name+state (e.g. a falls mapped as
  // both node and way, or two distinct features sharing a name within ~1km or
  // beyond) collides on the base slug and gets -2, -3, ... appended.
  const usedSlugs = new Set();
  let totalMapped = 0;
  let totalUpserted = 0;
  let totalFailed = 0;

  for (let i = 0; i < states.length; i += 1) {
    const state = states[i];
    if (i > 0) await politeSleep(BETWEEN_STATES_MS);

    let json;
    try {
      json = await fetchOverpass(buildQuery(state), state);
    } catch (err) {
      console.error(`[${state}] skipped: ${err.message}`);
      continue;
    }

    const elements = Array.isArray(json?.elements) ? json.elements : [];
    const rows = [];
    for (const el of elements) {
      const row = mapElement(el, state);
      if (!row) continue;
      row.slug = uniqueSlug(slugify(row.name, state), usedSlugs);
      rows.push(row);
    }
    totalMapped += rows.length;

    if (flags.dry) {
      console.log(`[${state}] ${elements.length} elements -> ${rows.length} rows (dry run, not written)`);
      continue;
    }

    const { upserted, failed } = await batchUpsert(client, rows);
    totalUpserted += upserted;
    totalFailed += failed;
    console.log(
      `[${state}] ${elements.length} elements -> ${rows.length} rows; upserted ${upserted}, failed ${failed}`,
    );
  }

  if (flags.dry) {
    console.log(`Done (dry run). ${totalMapped} rows mapped across ${states.length} state(s).`);
  } else {
    console.log(
      `Done. ${totalMapped} rows mapped, ${totalUpserted} upserted, ${totalFailed} failed across ${states.length} state(s).`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
