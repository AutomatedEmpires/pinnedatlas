#!/usr/bin/env node
// USGS GNIS (Geographic Names Information System) supplemental ingestion.
// Adds gazetteer features (Falls, Cave, Spring) that OSM lacks, deduping each
// candidate against nearby existing DB rows before insert.
//
// Best-effort by design: the gaz-domestic search API is not formally
// documented, so we probe a few known parameter spellings and verify the
// response shape at runtime. If the shape is unrecognized we log a clear
// message and exit gracefully — this script must never crash the pipeline.
//
// Usage:
//   node scripts/ingest-gnis.mjs                 # all covered states
//   node scripts/ingest-gnis.mjs --states=CO,UT  # subset
//   node scripts/ingest-gnis.mjs --dry           # log counts, no writes

import {
  FEATURE_DEFAULTS,
  STATES,
  batchUpsert,
  getClient,
  haversineKm,
  nameKey,
  normalizeName,
  parseFlags,
  politeSleep,
  slugify,
} from './ingest-lib.mjs';

const BASE_URL = 'https://edits.nationalmap.gov/apps/gaz-domestic/public/api/search';
const REQUEST_SLEEP_MS = 1500;
const DEDUPE_RADIUS_KM = 0.3;
const DEDUPE_BBOX_DEG = 0.02;
const MAX_SLUG_SUFFIX = 6;
const USER_AGENT = 'PinnedAtlas-ingest/1.0 (GNIS supplement)';

const FEATURE_CLASSES = [
  { featureClass: 'Falls', type: 'waterfall' },
  { featureClass: 'Cave', type: 'cave' },
  { featureClass: 'Spring', type: 'spring' },
];

// Known parameter spellings for the gaz-domestic search endpoint; probed in
// order until one returns a recognizable payload.
const PARAM_VARIANTS = [
  (fc, st) => `${BASE_URL}?q=&featureClass=${encodeURIComponent(fc)}&state=${st}&format=json`,
  (fc, st) => `${BASE_URL}?featureClass=${encodeURIComponent(fc)}&stateAbbrev=${st}&format=json`,
  (fc, st) => `${BASE_URL}?fClass=${encodeURIComponent(fc)}&state=${st}&f=json`,
];

async function fetchJson(url) {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    });
    if (!res.ok) {
      console.warn(`GNIS request failed (HTTP ${res.status}): ${url}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`GNIS request error (${err.message}): ${url}`);
    return null;
  }
}

/** Find the array of result items in whatever envelope the API uses. */
function extractItems(json) {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== 'object') return null;
  const keys = ['features', 'results', 'items', 'data', 'searchResults', 'domesticNames', 'gazetteer'];
  for (const key of keys) {
    if (Array.isArray(json[key])) return json[key];
  }
  if (json.result && Array.isArray(json.result.items)) return json.result.items;
  return null;
}

function pick(obj, keys) {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

/** Defensively map one raw API item to { id, name, lat, lng, elevation_m } or null. */
function mapItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  // Attributes may be top-level, or nested GeoJSON/ArcGIS style.
  const props = raw.properties ?? raw.attributes ?? raw;
  if (!props || typeof props !== 'object') return null;
  const id =
    pick(props, ['feature_id', 'featureId', 'FEATURE_ID', 'gaz_id', 'gazId', 'id']) ??
    pick(raw, ['id']);
  const name = pick(props, ['feature_name', 'featureName', 'FEATURE_NAME', 'gaz_name', 'gazName', 'name']);
  let lat = Number(pick(props, ['prim_lat_dec', 'primLatDec', 'latitude', 'lat', 'LATITUDE']));
  let lng = Number(pick(props, ['prim_long_dec', 'primLongDec', 'longitude', 'lng', 'lon', 'LONGITUDE']));
  if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && Array.isArray(raw.geometry?.coordinates)) {
    lng = Number(raw.geometry.coordinates[0]);
    lat = Number(raw.geometry.coordinates[1]);
  }
  if (id === null || id === undefined || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  const elevation = Number.parseInt(pick(props, ['elev_in_m', 'elevM', 'elevMeters', 'elevation']), 10);
  return {
    id: String(id),
    name: normalizeName(String(name)),
    lat,
    lng,
    elevation_m: Number.isFinite(elevation) ? elevation : null,
  };
}

/**
 * Probe the API with one state/class expected to have results and return the
 * index of the first parameter variant whose response we can parse, or -1.
 */
async function chooseVariant(probeState) {
  for (let i = 0; i < PARAM_VARIANTS.length; i += 1) {
    const url = PARAM_VARIANTS[i]('Falls', probeState);
    const json = await fetchJson(url);
    await politeSleep(REQUEST_SLEEP_MS);
    if (!json) continue;
    const items = extractItems(json);
    if (!items) continue;
    const mapped = items.map(mapItem).filter(Boolean);
    if (mapped.length > 0) {
      console.log(`GNIS: using param variant ${i + 1} (probe Falls/${probeState}: ${mapped.length} usable items)`);
      return i;
    }
  }
  return -1;
}

/**
 * True when an existing DB row within ~300m matches the candidate by feature
 * type or by fuzzy name (lowercased alphanumeric containment). The candidate's
 * own row from a previous run (same source/source_ref) never counts — the
 * upsert would simply update it.
 */
async function existsNearby(client, candidate) {
  const { data, error } = await client
    .from('location')
    .select('id,name,lat,lng,feature_type,source,source_ref')
    .gte('lat', candidate.lat - DEDUPE_BBOX_DEG)
    .lte('lat', candidate.lat + DEDUPE_BBOX_DEG)
    .gte('lng', candidate.lng - DEDUPE_BBOX_DEG)
    .lte('lng', candidate.lng + DEDUPE_BBOX_DEG)
    .limit(200);
  if (error) {
    console.warn(`GNIS dedupe query failed (${error.message}); keeping candidate ${candidate.source_ref}`);
    return false;
  }
  const candKey = nameKey(candidate.name);
  for (const row of data ?? []) {
    if (row.source === candidate.source && row.source_ref === candidate.source_ref) continue;
    if (haversineKm(candidate.lat, candidate.lng, row.lat, row.lng) >= DEDUPE_RADIUS_KM) continue;
    const rowKey = nameKey(row.name ?? '');
    const namesSimilar =
      candKey.length > 0 && rowKey.length > 0 && (candKey.includes(rowKey) || rowKey.includes(candKey));
    if (row.feature_type === candidate.feature_type || namesSimilar) return true;
  }
  return false;
}

/**
 * Assign final slugs: check candidate slugs (plus suffixed variants) against
 * existing DB slugs in bulk so the unique slug index doesn't reject rows whose
 * name collides with another source's row. Slugs already owned by the same
 * (source, source_ref) are kept — the upsert updates that row in place.
 */
async function assignSlugs(client, rows, usedSlugs) {
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const variants = [];
    for (const row of chunk) {
      variants.push(row.slugBase);
      for (let n = 2; n <= MAX_SLUG_SUFFIX; n += 1) variants.push(`${row.slugBase}-${n}`);
    }
    const taken = new Set();
    if (client) {
      const { data, error } = await client
        .from('location')
        .select('slug,source,source_ref')
        .in('slug', variants);
      if (error) {
        console.warn(`GNIS slug lookup failed (${error.message}); relying on per-row upsert errors`);
      }
      for (const existing of data ?? []) {
        const ownedByCandidate = chunk.some(
          (c) => c.source === existing.source && c.source_ref === existing.source_ref,
        );
        if (!ownedByCandidate) taken.add(existing.slug);
      }
    }
    for (const row of chunk) {
      let slug = row.slugBase;
      let n = 2;
      while (usedSlugs.has(slug) || taken.has(slug)) {
        slug = `${row.slugBase}-${n}`;
        n += 1;
      }
      usedSlugs.add(slug);
      row.slug = slug;
      delete row.slugBase;
    }
  }
}

async function main() {
  const flags = parseFlags();
  const states = flags.states?.length ? flags.states : STATES;

  let client = null;
  try {
    client = getClient();
  } catch (err) {
    if (!flags.dry) throw err;
    console.warn(`${err.message}\nDry run continues without DB dedupe or slug checks.`);
  }

  const variantIndex = await chooseVariant(states[0]);
  if (variantIndex === -1) {
    console.error(
      'GNIS: could not recognize the gaz-domestic API response shape with any known ' +
        'parameter spelling. The API may have changed — this supplement is best-effort, ' +
        'so exiting without changes. Inspect ' + BASE_URL + ' manually and update ' +
        'scripts/ingest-gnis.mjs (PARAM_VARIANTS / extractItems / mapItem).',
    );
    return;
  }
  const buildUrl = PARAM_VARIANTS[variantIndex];

  const usedSlugs = new Set();
  const seenRefs = new Set();
  let totalFetched = 0;
  let totalSkipped = 0;
  let totalUpserted = 0;
  let totalFailed = 0;
  let totalKept = 0;

  for (const state of states) {
    let stateFetched = 0;
    let stateSkipped = 0;
    const stateRows = [];

    for (const fc of FEATURE_CLASSES) {
      const json = await fetchJson(buildUrl(fc.featureClass, state));
      await politeSleep(REQUEST_SLEEP_MS);
      if (!json) continue;
      const items = extractItems(json) ?? [];
      const mapped = items.map(mapItem).filter(Boolean);
      stateFetched += mapped.length;

      for (const item of mapped) {
        const sourceRef = `gnis/${item.id}`;
        if (seenRefs.has(sourceRef)) continue;
        seenRefs.add(sourceRef);

        const featureType =
          fc.type === 'spring' && /hot spring/i.test(item.name) ? 'hot_spring' : fc.type;
        const defaults = FEATURE_DEFAULTS[featureType];
        const candidate = {
          name: item.name,
          feature_type: featureType,
          lat: item.lat,
          lng: item.lng,
          elevation_m: item.elevation_m,
          description: null,
          difficulty_tier: defaults.difficulty_tier,
          access_type: 'unclear',
          hazard_notes: defaults.hazard_notes,
          source: 'usgs',
          source_ref: sourceRef,
          state_code: state,
          moderation_status: 'community',
          slugBase: slugify(item.name, state),
        };

        if (client && (await existsNearby(client, candidate))) {
          stateSkipped += 1;
          continue;
        }
        stateRows.push(candidate);
      }
    }

    await assignSlugs(client, stateRows, usedSlugs);
    totalFetched += stateFetched;
    totalSkipped += stateSkipped;
    totalKept += stateRows.length;

    if (flags.dry || !client) {
      console.log(
        `[${state}] ${stateFetched} fetched, ${stateSkipped} deduped, ${stateRows.length} would insert (dry run)`,
      );
      continue;
    }
    const { upserted, failed } = await batchUpsert(client, stateRows);
    totalUpserted += upserted;
    totalFailed += failed;
    console.log(
      `[${state}] ${stateFetched} fetched, ${stateSkipped} deduped, upserted ${upserted}, failed ${failed}`,
    );
  }

  if (flags.dry || !client) {
    console.log(
      `Done (dry run). ${totalFetched} fetched, ${totalSkipped} deduped, ${totalKept} would insert across ${states.length} state(s).`,
    );
  } else {
    console.log(
      `Done. ${totalFetched} fetched, ${totalSkipped} deduped, ${totalUpserted} upserted, ${totalFailed} failed across ${states.length} state(s).`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
