import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { locationsNear } from '@/lib/db/locations';

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius_m: z.coerce.number().min(1).max(200_000).default(40_000),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  // `?? undefined` so absent params hit zod defaults instead of coercing null -> 0.
  const parsed = querySchema.safeParse({
    lat: sp.get('lat') ?? undefined,
    lng: sp.get('lng') ?? undefined,
    radius_m: sp.get('radius_m') ?? undefined,
    limit: sp.get('limit') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const { lat, lng, radius_m, limit } = parsed.data;
    const locations = await locationsNear(lat, lng, radius_m, limit);
    return NextResponse.json({ locations });
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
