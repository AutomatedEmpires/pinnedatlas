# PinnedAtlas

Mobile-first, map-first app for discovering caves, waterfalls, hot springs, and other natural
geological features — with accurate locations, community-reported conditions, and difficulty
ratings. Monetized via a $4.99/month subscription.

**Status:** zero-to-one production build in progress. See [`FABLE5_BUILD_BRIEF.md`](./FABLE5_BUILD_BRIEF.md)
for the full mandate and [`AGENTS.md`](./AGENTS.md) for the agent operating contract.

## Stack

Next.js (App Router) + React + TypeScript, Tailwind, Clerk (auth), Supabase Postgres + PostGIS
(geospatial data), Mapbox (maps), Stripe Billing (subscriptions), Cloudinary (media),
PostHog + Sentry (observability), Resend (email), Phosphor (icons). Hosted on Vercel, secrets
via Doppler. Same integration spine as the rest of the AutomatedEmpires venture portfolio.

## Getting started

```bash
nvm use            # Node 24.16.0
pnpm install
cp .env.example .env.local   # fill in what you have — every integration degrades gracefully
pnpm dev
```

- `pnpm validate` — lint + typecheck + tests + build (what CI runs).
- `pnpm ops:ingest-overpass` — seed real cave/waterfall/hot-spring data from OpenStreetMap
  (needs Supabase env). See [scripts/README.md](./scripts/README.md).
- Secrets source of truth is Doppler; sync to Vercel with
  `./scripts/sync-vercel-env-from-doppler.sh`.

Missing keys never crash the app: without Clerk it runs signed-out-only, without Mapbox the
map falls back to list browsing, without Stripe checkout reports "payments launching soon",
without Supabase pages render empty states.