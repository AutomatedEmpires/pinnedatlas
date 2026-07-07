import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin, UnauthorizedError } from '@/lib/auth';
import { moderateLocation } from '@/lib/db/locations';
import { deleteReport } from '@/lib/db/reports';

const bodySchema = z.object({
  kind: z.enum(['location', 'report']),
  id: z.string().uuid(),
  action: z.enum(['approve', 'verify', 'reject', 'delete']),
});

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid input' }, { status: 400 });
    }
    const { kind, id, action } = parsed.data;

    if (kind === 'location') {
      if (action === 'delete') {
        return NextResponse.json({ error: 'invalid action for location' }, { status: 400 });
      }
      await moderateLocation(id, action);
    } else {
      if (action !== 'delete') {
        return NextResponse.json({ error: 'invalid action for report' }, { status: 400 });
      }
      await deleteReport(id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
