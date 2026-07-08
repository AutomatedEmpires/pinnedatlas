import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId, UnauthorizedError } from '@/lib/auth';
import { hasSupabase } from '@/lib/env';
import { getServiceClient } from '@/lib/db/client';
import { insertReport } from '@/lib/db/reports';
import { clientKey, rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { REPORT_TYPES, type ReportType } from '@/lib/types';

const PUBLIC_STATUSES = ['verified', 'community'];

const reportSchema = z.object({
  report_type: z.enum(REPORT_TYPES as [ReportType, ...ReportType[]]),
  body: z.string().trim().min(3).max(1000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rl = rateLimit(clientKey(req, 'report'), 15, 60_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const userId = await requireUserId();

    if (!hasSupabase) {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 503 });
    }
    const db = getServiceClient();
    if (!db) {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 503 });
    }

    const { id } = await params;

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }
    const parsed = reportSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid_input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Reports may only be attached to publicly visible locations.
    const { data: location, error: lookupError } = await db
      .from('location')
      .select('id, moderation_status')
      .eq('id', id)
      .maybeSingle();
    if (lookupError) {
      // A malformed UUID surfaces as a Postgres cast error (22P02) — treat as not found.
      if (lookupError.code === '22P02' || lookupError.message.includes('invalid input syntax')) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
      }
      throw new Error(`report location lookup: ${lookupError.message}`);
    }
    if (!location || !PUBLIC_STATUSES.includes(location.moderation_status)) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const report = await insertReport({
      location_id: id,
      user_id: userId,
      report_type: parsed.data.report_type,
      body: parsed.data.body,
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    console.error('POST /api/locations/[id]/reports failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
