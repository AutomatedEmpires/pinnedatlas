import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserId, UnauthorizedError } from '@/lib/auth';
import { getEntitlement, type Entitlement } from '@/lib/billing/entitlements';
import { countSaves, getStatesForUser, upsertState } from '@/lib/db/user-state';
import { clientKey, rateLimit, tooManyRequests } from '@/lib/rate-limit';

export async function GET() {
  try {
    const userId = await requireUserId();
    const states = await getStatesForUser(userId);
    return NextResponse.json({ states });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

const bodySchema = z.object({
  location_id: z.string().uuid(),
  saved: z.boolean().optional(),
  visited: z.boolean().optional(),
  personal_note: z.string().max(2000).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const rl = rateLimit(clientKey(request, 'user-state'), 60, 60_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const userId = await requireUserId();

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }
    const { location_id, saved, visited, personal_note } = parsed.data;
    if (saved === undefined && visited === undefined && personal_note === undefined) {
      return NextResponse.json({ error: 'no_fields' }, { status: 400 });
    }

    // Entitlements are enforced here, server-side — client UI gating is cosmetic.
    let entitlement: Entitlement | null = null;
    const loadEntitlement = async () => (entitlement ??= await getEntitlement(userId));

    if (saved === true) {
      // Only saving a spot that is not already saved consumes save quota.
      const [existing] = await getStatesForUser(userId, [location_id]);
      if (!existing?.saved) {
        const { saveLimit } = await loadEntitlement();
        if (saveLimit !== null && (await countSaves(userId)) >= saveLimit) {
          return NextResponse.json({ error: 'save_limit', limit: saveLimit }, { status: 402 });
        }
      }
    }

    if (visited !== undefined || personal_note !== undefined) {
      const { isPremium } = await loadEntitlement();
      if (!isPremium) {
        return NextResponse.json({ error: 'premium_required' }, { status: 402 });
      }
    }

    const patch: { saved?: boolean; visited?: boolean; personal_note?: string | null } = {};
    if (saved !== undefined) patch.saved = saved;
    if (visited !== undefined) patch.visited = visited;
    if (personal_note !== undefined) patch.personal_note = personal_note;

    const state = await upsertState(userId, location_id, patch);
    return NextResponse.json({ state });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
