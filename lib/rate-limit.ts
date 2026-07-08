// Best-effort in-memory rate limiter. Serverless instances each keep their own
// counters, so this is per-instance mitigation, not a hard global cap — good
// enough to blunt casual abuse of write/AI endpoints. For a strict global limit,
// move to a shared store (e.g. Upstash Redis) later.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (now > b.resetAt) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // seconds until the window resets
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** Derive a stable client key from the forwarded IP (Vercel sets x-forwarded-for). */
export function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return `${scope}:${ip}`;
}

/** Standard 429 JSON response for a blocked request. */
export function tooManyRequests(retryAfter: number): Response {
  return new Response(JSON.stringify({ error: 'rate_limited', retryAfter }), {
    status: 429,
    headers: { 'content-type': 'application/json', 'retry-after': String(retryAfter) },
  });
}
