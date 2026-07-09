// Promote cross-referenced locations to `verified`.
//
// "Verified" means we have corroborating evidence of a spot's accuracy. A
// location that carries BOTH a description AND a photo came from the OSM →
// Wikidata → Wikipedia/Commons enrichment path, i.e. it is cross-referenced
// across multiple independent open sources — a reasonable automated-verification
// bar until human moderation exists. Idempotent; safe to re-run.
//
// Usage: node scripts/promote-verified.mjs [--dry]

import { getClient, parseFlags } from './ingest-lib.mjs';

async function main() {
  const { dry } = parseFlags();
  const client = getClient();

  // Collect location_ids that have at least one media row (paginated).
  const withMedia = new Set();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client
      .from('location_media')
      .select('location_id')
      .range(from, from + 999);
    if (error) throw new Error(`media fetch: ${error.message}`);
    for (const r of data || []) withMedia.add(r.location_id);
    if (!data || data.length < 1000) break;
  }
  const ids = [...withMedia];
  console.log(`locations with a photo: ${ids.length}`);

  if (dry) {
    // Count how many would be promoted without writing.
    let candidates = 0;
    for (let i = 0; i < ids.length; i += 200) {
      const { count, error } = await client
        .from('location')
        .select('id', { count: 'exact', head: true })
        .in('id', ids.slice(i, i + 200))
        .eq('moderation_status', 'community')
        .not('description', 'is', null);
      if (!error) candidates += count ?? 0;
    }
    console.log(`would promote: ${candidates} (dry run)`);
    return;
  }

  let promoted = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await client
      .from('location')
      .update({ moderation_status: 'verified' })
      .in('id', ids.slice(i, i + 200))
      .eq('moderation_status', 'community')
      .not('description', 'is', null)
      .select('id');
    if (error) {
      console.error(`chunk ${i / 200}: ${error.message}`);
      continue;
    }
    promoted += (data || []).length;
  }
  console.log(`promoted to verified: ${promoted}`);
}

main().catch((err) => {
  console.error('promote-verified failed:', err);
  process.exit(1);
});
