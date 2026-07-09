import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getConditions } from '@/lib/conditions';
import { getStaleConditionSpots, touchConditions, writeConditions } from '@/lib/db/conditions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(req: Request): boolean {
  if (!env.cronSecret) return false;
  if (req.headers.get('authorization') === `Bearer ${env.cronSecret}`) return true;
  return new URL(req.url).searchParams.get('token') === env.cronSecret;
}

async function mapLimited<T>(items: T[], limit: number, fn: (t: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx]);
      }
    }),
  );
}

// Refreshes the stalest waterfalls/hot-springs' Go Scores. Vercel Cron hits this
// hourly; it is also called in a loop to seed. Auth via CRON_SECRET.
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const limit = Math.min(500, Math.max(1, Number(new URL(req.url).searchParams.get('limit') ?? 120)));
  try {
    const spots = await getStaleConditionSpots(limit);
    let updated = 0;
    let failed = 0;
    await mapLimited(spots, 8, async (s) => {
      try {
        // Stored scores power the map/discovery, which are used for planning —
        // so they ignore time-of-day. The detail page computes 'now' live.
        const c = await getConditions(
          { lat: s.lat, lng: s.lng, feature_type: s.feature_type },
          'planning',
        );
        if (c) {
          await writeConditions(s.id, {
            score: c.goScore,
            verdict: c.verdict,
            flowPct: c.flow?.percentOfNormal ?? null,
            headline: c.headline,
          });
          updated += 1;
        } else {
          await touchConditions(s.id);
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    });
    return NextResponse.json({ processed: spots.length, updated, failed });
  } catch {
    return NextResponse.json({ error: 'compute_failed' }, { status: 500 });
  }
}
