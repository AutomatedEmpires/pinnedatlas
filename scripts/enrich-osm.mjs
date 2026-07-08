// Enrich existing OSM locations with real photos + descriptions.
//
// Source of truth is what OSM itself links: the `wikidata`, `wikimedia_commons`,
// `wikipedia`, `image`, and `description` tags. We only use images hosted on
// Wikimedia (upload/commons.wikimedia.org) — the ones our CSP + next/image allow —
// and we fetch proper CC attribution (artist + license) for each so usage is clean.
//
// Idempotent: descriptions are only filled when currently null; a location that
// already has any media row is skipped for photos. Re-running is safe.
//
// Usage: node scripts/enrich-osm.mjs [--states=CO,UT] [--dry]
// Marquee feature types only (cave/waterfall/hot_spring) — springs rarely carry
// media and there are ~11k of them.

import { getClient, loadEnv, politeSleep, parseFlags, STATES } from './ingest-lib.mjs';

const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const UA = 'PinnedAtlas/1.0 (enrichment; contact: hello@pinnedatlas.com)';

function buildQuery(state) {
  return [
    '[out:json][timeout:180];',
    `area["ISO3166-2"="US-${state}"][admin_level=4]->.a;`,
    '(',
    '  nwr[natural=cave_entrance](area.a);',
    '  nwr[waterway=waterfall](area.a);',
    '  nwr[natural=hot_spring](area.a);',
    ');',
    'out tags center;',
  ].join('\n');
}

async function overpass(query, state) {
  for (const endpoint of OVERPASS) {
    try {
      let res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (res.status === 429 || res.status === 504) {
        console.warn(`[${state}] overpass ${res.status}; retry in 30s`);
        await politeSleep(30000);
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
          body: `data=${encodeURIComponent(query)}`,
        });
      }
      if (res.ok) return await res.json();
      console.warn(`[${state}] overpass ${endpoint} HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[${state}] overpass ${endpoint} error: ${err.message}`);
    }
  }
  return null;
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function commonsFileFromTag(tag) {
  if (!tag) return null;
  let name = String(tag).trim();
  name = name.replace(/^File:/i, '');
  return name || null;
}

// --- Wikidata: batch fetch descriptions + P18 image filename ---
async function fetchWikidata(ids) {
  const result = new Map(); // id -> { description, image }
  for (const group of chunk([...ids], 50)) {
    const url =
      'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json' +
      `&ids=${group.join('|')}&props=descriptions|claims&languages=en`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) continue;
      const data = await res.json();
      for (const [id, entity] of Object.entries(data.entities || {})) {
        const description = entity?.descriptions?.en?.value || null;
        let image = null;
        const p18 = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        if (p18) image = commonsFileFromTag(p18);
        result.set(id, { description, image });
      }
    } catch (err) {
      console.warn(`wikidata batch error: ${err.message}`);
    }
    await politeSleep(500);
  }
  return result;
}

// --- Wikipedia: REST summary for a "lang:Title" tag ---
async function fetchWikipediaSummary(wikipediaTag) {
  const m = String(wikipediaTag).match(/^([a-z]{2,3}):(.+)$/);
  const lang = m ? m[1] : 'en';
  const title = m ? m[2] : wikipediaTag;
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const data = await res.json();
    const extract = data?.extract;
    if (extract && extract.length > 40) return extract.slice(0, 1000);
  } catch {
    /* best effort */
  }
  return null;
}

// --- Commons: batch resolve File titles to a hosted thumb URL + attribution ---
async function fetchCommonsImages(files) {
  const result = new Map(); // File title -> { url, credit }
  for (const group of chunk([...files], 40)) {
    const titles = group.map((f) => `File:${f}`).join('|');
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
      '&iiprop=url|extmetadata&iiurlwidth=1024&titles=' +
      encodeURIComponent(titles);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) continue;
      const data = await res.json();
      for (const page of Object.values(data?.query?.pages || {})) {
        const info = page?.imageinfo?.[0];
        if (!info) continue;
        const src = info.thumburl || info.url;
        if (!src || !/^https:\/\/(upload|commons)\.wikimedia\.org\//.test(src)) continue;
        const meta = info.extmetadata || {};
        const artist = stripHtml(meta.Artist?.value) || 'Unknown';
        const license = stripHtml(meta.LicenseShortName?.value) || 'see Commons';
        const title = String(page.title || '').replace(/^File:/i, '');
        result.set(title, {
          url: src,
          credit: `${artist} · ${license} (Wikimedia Commons)`.slice(0, 300),
        });
      }
    } catch (err) {
      console.warn(`commons batch error: ${err.message}`);
    }
    await politeSleep(500);
  }
  return result;
}

async function main() {
  const flags = parseFlags();
  const states = flags.states || STATES;
  const client = getClient();
  loadEnv();

  // Phase 1: gather OSM tags per source_ref across states.
  const tagsByRef = new Map(); // source_ref -> { description, wikidata, commons, wikipedia }
  for (const state of states) {
    const json = await overpass(buildQuery(state), state);
    let n = 0;
    for (const el of json?.elements || []) {
      const t = el.tags || {};
      if (!t.name) continue;
      const ref = `${el.type}/${el.id}`;
      const commons = commonsFileFromTag(t.wikimedia_commons) || commonsFileFromTag(t.image?.startsWith('File:') ? t.image : null);
      if (!t.description && !t.wikidata && !commons && !t.wikipedia) continue;
      tagsByRef.set(ref, {
        description: t.description ? String(t.description).slice(0, 1500) : null,
        wikidata: t.wikidata || null,
        commons,
        wikipedia: t.wikipedia || null,
      });
      n += 1;
    }
    console.log(`[${state}] ${n} elements with enrichable tags`);
    await politeSleep(8000);
  }

  const refs = [...tagsByRef.keys()];
  console.log(`Total enrichable OSM refs: ${refs.length}`);
  if (refs.length === 0) return;

  // Phase 2: match to DB rows (id, source_ref, description, has media?).
  const rows = []; // { id, source_ref, description }
  for (const group of chunk(refs, 300)) {
    const { data, error } = await client
      .from('location')
      .select('id, source_ref, description')
      .eq('source', 'osm')
      .in('source_ref', group);
    if (error) {
      console.error(`db match error: ${error.message}`);
      continue;
    }
    rows.push(...(data || []));
  }
  console.log(`Matched ${rows.length} existing OSM rows`);

  const ids = rows.map((r) => r.id);
  const haveMedia = new Set();
  for (const group of chunk(ids, 300)) {
    const { data } = await client.from('location_media').select('location_id').in('location_id', group);
    for (const m of data || []) haveMedia.add(m.location_id);
  }

  // Phase 3: resolve Wikidata (description + P18) for refs that have a wikidata id.
  const wikidataIds = new Set();
  for (const r of rows) {
    const t = tagsByRef.get(r.source_ref);
    if (t?.wikidata) wikidataIds.add(t.wikidata);
  }
  console.log(`Resolving ${wikidataIds.size} Wikidata entities…`);
  const wikidata = await fetchWikidata(wikidataIds);

  // Phase 4: build description updates + image candidates.
  const descUpdates = []; // { id, description }
  const imageCandidates = []; // { id, file }
  const wikipediaToFetch = []; // { id, wikipedia }

  for (const r of rows) {
    const t = tagsByRef.get(r.source_ref);
    if (!t) continue;
    const wd = t.wikidata ? wikidata.get(t.wikidata) : null;

    // description: OSM > Wikidata > (later) Wikipedia
    if (!r.description) {
      const desc = t.description || wd?.description || null;
      if (desc) descUpdates.push({ id: r.id, description: desc });
      else if (t.wikipedia) wikipediaToFetch.push({ id: r.id, wikipedia: t.wikipedia });
    }

    // image: OSM commons > Wikidata P18 (only if no media yet)
    if (!haveMedia.has(r.id)) {
      const file = t.commons || wd?.image || null;
      if (file) imageCandidates.push({ id: r.id, file });
    }
  }

  // Wikipedia summaries for rows still missing a description (cap to be polite).
  const WIKI_CAP = 400;
  for (const item of wikipediaToFetch.slice(0, WIKI_CAP)) {
    const extract = await fetchWikipediaSummary(item.wikipedia);
    if (extract) descUpdates.push({ id: item.id, description: extract });
    await politeSleep(150);
  }

  // Resolve image files -> hosted url + credit.
  const uniqueFiles = [...new Set(imageCandidates.map((c) => c.file))];
  console.log(`Resolving ${uniqueFiles.length} Commons images…`);
  const commonsImages = await fetchCommonsImages(uniqueFiles);

  const mediaRows = [];
  for (const c of imageCandidates) {
    const img = commonsImages.get(c.file);
    if (img) {
      mediaRows.push({
        location_id: c.id,
        url: img.url,
        credit: img.credit,
        moderation_status: 'community',
      });
    }
  }

  console.log(
    `Ready: ${descUpdates.length} description updates, ${mediaRows.length} photos` +
      (flags.dry ? ' (dry run — nothing written)' : ''),
  );
  if (flags.dry) return;

  // Write descriptions (only fill nulls — WHERE guarded by is null for safety).
  let descWritten = 0;
  for (const u of descUpdates) {
    const { error } = await client
      .from('location')
      .update({ description: u.description })
      .eq('id', u.id)
      .is('description', null);
    if (!error) descWritten += 1;
    else console.error(`desc update ${u.id}: ${error.message}`);
  }

  // Insert media (dedupe on location already handled; guard again just in case).
  let mediaWritten = 0;
  for (const group of chunk(mediaRows, 200)) {
    const { error } = await client.from('location_media').insert(group);
    if (!error) mediaWritten += group.length;
    else {
      // fall back to row-by-row on chunk failure
      for (const row of group) {
        const { error: e2 } = await client.from('location_media').insert(row);
        if (!e2) mediaWritten += 1;
      }
    }
  }

  console.log(`Done. Wrote ${descWritten} descriptions and ${mediaWritten} photos.`);
}

main().catch((err) => {
  console.error('enrich-osm failed:', err);
  process.exit(1);
});
