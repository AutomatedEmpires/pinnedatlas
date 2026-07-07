// Shared helpers for PinnedAtlas geodata ingestion scripts.
// Plain Node ESM — NOT part of the Next build, so nothing here may import from
// lib/*.ts. Logic that must match app code (slugify, haversine) is reimplemented
// verbatim from lib/geo.ts; keep the two in sync if either changes.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Parse .env.local at the repo root (KEY=VALUE lines, `#` comments and blank
 * lines ignored, surrounding quotes stripped). Values already present in
 * process.env take precedence over the file.
 */
export function loadEnv() {
  const merged = {};
  const envPath = path.join(REPO_ROOT, '.env.local');
  if (existsSync(envPath)) {
    for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
        (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
      ) {
        value = value.slice(1, -1);
      }
      merged[match[1]] = value;
    }
  }
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) merged[key] = value;
  }
  return merged;
}

/** Service-role Supabase client. Throws with a clear message if env is missing. */
export function getClient() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY in .env.local (or the environment) before ' +
        'running ingestion scripts.',
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** IDENTICAL logic to slugify() in lib/geo.ts — do not diverge. */
export function slugify(name, stateCode) {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return stateCode ? `${base}-${stateCode.toLowerCase()}` : base;
}

/** Great-circle distance in km — same formula as lib/geo.ts. */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Collapse whitespace and trim — canonical form for stored names. */
export function normalizeName(name) {
  return String(name).replace(/\s+/g, ' ').trim();
}

/** Lowercased alphanumeric-only key for fuzzy name comparison. */
export function nameKey(name) {
  return normalizeName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Per-feature-type difficulty and hazard defaults for ingested rows. */
export const FEATURE_DEFAULTS = {
  cave: {
    difficulty_tier: 'hard',
    hazard_notes:
      'Cave environments are dangerous: unstable rock, drops, disorientation, and hypothermia. Never enter alone, bring 3 light sources, and check access rules — many caves are gated or seasonally closed for bat conservation.',
  },
  waterfall: {
    difficulty_tier: 'moderate',
    hazard_notes:
      'Rocks near falls are slick; currents and submerged hazards make swimming dangerous. Stay on trail and keep back from edges.',
  },
  hot_spring: {
    difficulty_tier: 'easy',
    hazard_notes:
      'Water temperatures vary and can scald; never dunk your head (risk of thermophilic organisms); fragile ecosystems — no soap.',
  },
  spring: {
    difficulty_tier: 'easy',
    hazard_notes:
      'Untreated spring water may be unsafe to drink. Terrain around sources can be muddy and unstable.',
  },
  other: {
    difficulty_tier: 'moderate',
    hazard_notes:
      'Backcountry conditions vary; research current access, terrain, and weather before visiting.',
  },
};

/** States covered by the ingestion pipeline (ISO 3166-2 US codes). */
export const STATES = [
  'WA', 'OR', 'CA', 'ID', 'NV', 'UT', 'AZ', 'MT',
  'WY', 'CO', 'NM', 'TX', 'AR', 'MO', 'TN', 'NC',
];

export function politeSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reserve a unique slug for this run: if `base` is taken, append -2, -3, ...
 * Marks the returned slug as used in the provided Set.
 */
export function uniqueSlug(base, used) {
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  used.add(candidate);
  return candidate;
}

/** Parse shared CLI flags: --states=CO,UT and --dry. */
export function parseFlags(argv = process.argv.slice(2)) {
  const flags = { dry: false, states: null };
  for (const arg of argv) {
    if (arg === '--dry') {
      flags.dry = true;
    } else if (arg.startsWith('--states=')) {
      flags.states = arg
        .slice('--states='.length)
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
    } else {
      console.warn(`Unknown flag ignored: ${arg}`);
    }
  }
  return flags;
}

/**
 * Upsert rows into `location` in chunks of 200 on (source, source_ref).
 * A failed chunk is retried row-by-row so one bad row (e.g. a slug collision)
 * doesn't discard its 199 neighbors; failures are logged, never thrown.
 * Returns { upserted, failed }.
 */
export async function batchUpsert(client, rows) {
  const CHUNK = 200;
  let upserted = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await client
      .from('location')
      .upsert(chunk, { onConflict: 'source,source_ref' });
    if (!error) {
      upserted += chunk.length;
      continue;
    }
    console.error(
      `[batchUpsert] chunk ${Math.floor(i / CHUNK) + 1} failed (${error.message}); retrying rows individually`,
    );
    for (const row of chunk) {
      const { error: rowError } = await client
        .from('location')
        .upsert(row, { onConflict: 'source,source_ref' });
      if (rowError) {
        failed += 1;
        console.error(
          `[batchUpsert]   row failed source_ref=${row.source_ref} slug=${row.slug}: ${rowError.message}`,
        );
      } else {
        upserted += 1;
      }
    }
  }
  return { upserted, failed };
}
