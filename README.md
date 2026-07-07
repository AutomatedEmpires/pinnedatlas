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

See `.env.example` for required environment variables. Local setup instructions land alongside
the initial app scaffold — see `FABLE5_BUILD_BRIEF.md` for build status.