# PinnedAtlas — Agent Operating Contract

This file is binding for every contributor and coding agent touching this repo.

## Prime Doctrine
- Notion decides.
- GitHub builds.
- Figma shows.
- Everything else runs.

## Source of Truth Split
- No locked Notion canon exists yet for PinnedAtlas. Until one is authored, `FABLE5_BUILD_BRIEF.md` in this repo's root is the authoritative product/spec truth for the initial zero-to-one production build.
- Once Notion canon exists for this product, standard doctrine resumes: Notion = product/vision truth, this repo = implementation truth, product conflicts resolve to Notion.

## Core Rule
Standard steady-state flow: Spec -> Acceptance Criteria -> Branch -> Implementation -> PR -> Review -> CI -> Merge -> Deploy -> Notion status update.

**Founder-authorized exception for the initial build pass only:** there is no existing product surface to regress, so direct continuous iteration on `main` is permitted to maximize execution speed during the first zero-to-one pass described in `FABLE5_BUILD_BRIEF.md`. Once the app is live with real users, resume standard branch/PR/review discipline.

## Working Rules (steady-state, resumes after initial build pass)
- One branch per slice.
- One owner per task.
- Open a PR against `main`.
- Never push directly to `main`.
- Builder is never the sole approver.
- Never commit secrets.
- No destructive operations without explicit approval.

## Runtime
- Node `24.16.0`
- pnpm `10.12.4`
- GitHub-hosted CI runners by default

## Quality Bar
- TypeScript strict where applicable.
- Mobile-first and accessible UI.
- Small, reviewable PRs (steady-state).
- `lint`, `typecheck`, `test`, and `build` should stay green when those scripts exist.

## Integration Spine (pinned — do not introduce alternates without a dated decision)
Shared across the AutomatedEmpires venture portfolio (Sweepza, Explore & Earn, etc.):
- Secrets: Doppler
- Hosting: Vercel
- Database: Supabase Postgres + PostGIS (geospatial queries on location data)
- Auth: Clerk
- Maps: Mapbox
- Payments: Stripe Billing + Customer Portal (subscriptions only — **not** Stripe Connect; PinnedAtlas has no host/creator marketplace or payouts)
- Media: Cloudinary
- Observability: PostHog + Sentry
- Icons: Phosphor, single semantic registry
- Email: Resend
- Geodata ingestion: OpenStreetMap Overpass API (primary), USGS GNIS, National Park Service API, Wikidata (supplementary)

## Sensitive Areas
- auth
- payments / entitlements
- destructive database changes
- permissions / RLS
- trust & safety / content moderation (user-submitted locations and condition reports)
- legal / safety disclaimers — this product routes real people to caves, waterfalls, and hot springs; physical hazard and trespass-liability disclaimers are launch-blocking, not optional
- geodata licensing/attribution (OSM data is ODbL and requires visible attribution)

## Repo-Specific Additions
- Read `FABLE5_BUILD_BRIEF.md` before writing any code. It is the current build mandate.
- One canonical `location` object drives map pin, detail page, search, submission, and moderation. Never fork parallel location models for seeded vs. user-submitted data.
- User-specific state (saved/favorited, visited, personal notes) lives in `user_location_state`, never on `location`.
- Controlled values (`feature_type`, `difficulty_tier`, `access_type`, `moderation_status`, report reason) come from enums/dictionaries — no free text for these fields.
- Free vs. premium gating is enforced server-side against Stripe subscription status synced via webhook — never client-only.