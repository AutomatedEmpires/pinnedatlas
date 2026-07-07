import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId, UnauthorizedError } from '@/lib/auth';
import { hasSupabase } from '@/lib/env';
import { getServiceClient } from '@/lib/db/client';
import { insertSubmission } from '@/lib/db/locations';
import { slugify } from '@/lib/geo';
import {
  ACCESS_LABELS,
  DIFFICULTY_TIERS,
  FEATURE_TYPES,
  type AccessType,
  type DifficultyTier,
  type FeatureType,
  type LocationRecord,
} from '@/lib/types';

const MAX_PENDING_PER_USER = 20;
const MAX_SLUG_ATTEMPTS = 5;

const submissionSchema = z.object({
  name: z.string().trim().min(3).max(120),
  feature_type: z.enum(FEATURE_TYPES as [FeatureType, ...FeatureType[]]),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  difficulty_tier: z.enum(DIFFICULTY_TIERS as [DifficultyTier, ...DifficultyTier[]]).default('moderate'),
  access_type: z.enum(Object.keys(ACCESS_LABELS) as [AccessType, ...AccessType[]]),
  description: z.string().trim().max(2000).optional(),
  hazard_notes: z.string().trim().max(1000).optional(),
});

function isDuplicateSlugError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes('duplicate key') || message.includes('23505');
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();

    if (!hasSupabase) {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 503 });
    }
    const db = getServiceClient();
    if (!db) {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 503 });
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }
    const parsed = submissionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid_input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const input = parsed.data;

    // Anti-spam: cap how many unreviewed submissions one user can queue up.
    const { count, error: countError } = await db
      .from('location')
      .select('id', { count: 'exact', head: true })
      .eq('submitted_by', userId)
      .eq('moderation_status', 'pending');
    if (countError) {
      throw new Error(`pending count: ${countError.message}`);
    }
    if ((count ?? 0) >= MAX_PENDING_PER_USER) {
      return NextResponse.json({ error: 'too_many_pending' }, { status: 429 });
    }

    // No state code for user submissions; moderators can rename/redirect later.
    const baseSlug = slugify(input.name);
    if (!baseSlug) {
      // Name was entirely punctuation/symbols — cannot form a slug.
      return NextResponse.json(
        { error: 'invalid_input', details: { name: ['Name must include letters or numbers'] } },
        { status: 400 },
      );
    }

    let location: LocationRecord | null = null;
    for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
      const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;
      try {
        location = await insertSubmission({
          name: input.name,
          feature_type: input.feature_type,
          lat: input.lat,
          lng: input.lng,
          description: input.description || null,
          difficulty_tier: input.difficulty_tier,
          access_type: input.access_type,
          hazard_notes: input.hazard_notes || null,
          slug,
          submitted_by: userId,
        });
        break;
      } catch (err) {
        if (isDuplicateSlugError(err) && attempt < MAX_SLUG_ATTEMPTS) {
          continue;
        }
        throw err;
      }
    }
    if (!location) {
      throw new Error('insertSubmission: exhausted slug attempts');
    }

    return NextResponse.json(
      { location: { id: location.id, slug: location.slug } },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    console.error('POST /api/locations failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
