import { NextResponse } from 'next/server';
import { z } from 'zod';
import { listMapPins, type LocationFilters } from '@/lib/db/locations';
import {
  DIFFICULTY_TIERS,
  FEATURE_TYPES,
  FEATURE_TYPE_COLORS,
  type DifficultyTier,
  type FeatureType,
} from '@/lib/types';

const featureTypeSchema = z.enum(FEATURE_TYPES as [FeatureType, ...FeatureType[]]);
const difficultySchema = z.enum(DIFFICULTY_TIERS as [DifficultyTier, ...DifficultyTier[]]);

/** Parse a comma-separated param, silently dropping values that fail the schema. */
function parseList<T extends string>(value: string | null, schema: z.ZodType<T>): T[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is T => schema.safeParse(s).success);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const types = parseList(searchParams.get('types'), featureTypeSchema);
  const difficulties = parseList(searchParams.get('difficulties'), difficultySchema);
  const verifiedOnly = searchParams.get('verified') === '1';
  const q = searchParams.get('q')?.trim();
  const state = searchParams.get('state')?.trim();

  const filters: LocationFilters = {};
  if (types.length) filters.types = types;
  if (difficulties.length) filters.difficulties = difficulties;
  if (verifiedOnly) filters.verifiedOnly = true;
  if (q) filters.q = q;
  if (state) filters.state = state;

  // ~1m precision is ample for a pin and trims the payload vs. full float noise.
  const r5 = (n: number) => Math.round(n * 1e5) / 1e5;

  try {
    const locations = await listMapPins(filters);
    const collection = {
      type: 'FeatureCollection' as const,
      // Properties are intentionally lean — the client reads slug/name/type/
      // difficulty/moderation/color only. No row id is emitted (unused, and it
      // would add ~500KB of high-entropy UUIDs across the full dataset).
      features: locations.map((loc) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [r5(loc.lng), r5(loc.lat)] as [number, number],
        },
        properties: {
          slug: loc.slug,
          name: loc.name,
          feature_type: loc.feature_type,
          difficulty_tier: loc.difficulty_tier,
          moderation_status: loc.moderation_status,
          color: FEATURE_TYPE_COLORS[loc.feature_type],
          // Live "Right Now" conditions (null until the cron scores this spot).
          score: loc.condition_score,
          verdict: loc.condition_verdict,
        },
      })),
    };
    return NextResponse.json(collection, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'failed to load locations' }, { status: 500 });
  }
}
