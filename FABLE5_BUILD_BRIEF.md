# PinnedAtlas — Fable 5 Build Brief (Zero to One, One Pass to Production)

Updated: 2026-07-06
Written by: Claude, after auditing the repo and the AutomatedEmpires integration spine.

## Purpose

This is the build mandate for taking PinnedAtlas from an empty repository to a live,
monetized, production application in a single continuous execution pass. It exists so
Fable can start building immediately without re-auditing or re-deciding anything below.

## Founder mandate, distilled

- PinnedAtlas locates caves, waterfalls, hot springs, and other natural geological
  features that people want to go visit in person.
- Mobile-first, map-first product.
- Monetization: a **$4.99/month subscription is the primary model** (founder's explicit
  preference over a one-time fee). A one-time flat-fee tier (e.g., lifetime purchase)
  may exist as a secondary upsell but must not be the default or most prominent option.
- Core product capabilities: accurate location data, real-time-ish
  community-reported condition/status updates, and a difficulty rating per feature.
- Built on the same integration spine/runtime as the rest of the AutomatedEmpires
  venture portfolio, so it can be operated with the same tooling as Sweepza, Explore &
  Earn, etc.
- Fable executes. Do not spend budget re-auditing, re-comparing options, or writing
  status essays — the decisions in this document are final for this pass. Use
  subagents for mechanical/parallelizable work; spend your own reasoning on schema
  design, entitlement/payment correctness, and integration wiring. Minimize reports,
  maximize shipped and committed code.
- Required outcome: at the end of this pass, the app must be ready for **real users
  and real payments** — not a prototype, not a demo running on fake data.

## Repo + environment

- Repo: `AutomatedEmpires/pinnedatlas`
- Canonical local path: `/home/jackson/automatedempires/ventures/pinnedatlas`
  (sibling to `sweepza`, `explore-and-earn`, `lakeandpine`, `bidspace`, `logloads`)
- Branch: `main`. Repo state at handoff: `LICENSE`, `README.md`, `AGENTS.md`,
  `CLAUDE.md`, `.env.example`, `.github/` (CI, CodeQL, dependency review, PR/issue
  templates), and this file. No app code, no schema, no data. This is genuinely
  greenfield — there is no hidden prior context to go looking for.
- Org-wide engineering standard (applies here too):
  `/home/jackson/automatedempires/engineering-standards/AUTOMATEDEMPIRES_ENGINEERING_STANDARD.md`

## Integration spine (pinned — reuse, do not swap)

- Secrets: Doppler
- Hosting: Vercel
- Database: Supabase Postgres + **PostGIS** (geospatial point data, radius/nearest queries)
- Auth: Clerk
- Maps: **Mapbox** (this is the org-pinned map provider and a direct fit for this product)
- Payments: **Stripe Billing + Customer Portal** — subscriptions only. Do **not** use
  Stripe Connect; unlike Sweepza, PinnedAtlas has no host/creator marketplace or payouts.
- Media: Cloudinary
- Observability: PostHog + Sentry
- Icons: Phosphor, single semantic registry
- Email: Resend
- Runtime: Node `24.16.0`, pnpm `10.12.4`, Next.js (App Router) + React + TypeScript strict, Tailwind

## Objective / definition of done

The pass is complete when all of the following are real, not stubbed:

1. Map-first responsive web app (installable PWA) live in production on Vercel at a
   real domain.
2. Real geospatial schema in Supabase/Postgres+PostGIS (see Data model below).
3. A seeded dataset of real, correctly-located features ingested from public geodata —
   the map must not look empty at launch (see Data acquisition below).
4. Map UI: clustered pins, filter by feature type / difficulty / distance, search,
   list-view fallback, detail pages, directions deep-link to Google/Apple Maps, photos.
5. Auth via Clerk; signed-out browsing allowed for discovery, but saving, submitting,
   reporting, and full detail content require sign-in.
6. Core user flows shipped (see below): submit location, report condition/issue,
   save/My Spots, moderation queue.
7. Stripe subscription live: $4.99/month primary, annual discount option, optional
   one-time lifetime tier — entitlement enforced **server-side** via webhook-synced
   subscription status.
8. Moderation/trust: new submissions and reports enter `pending`/`community` state,
   not auto-published; provenance and freshness are visible on the detail page.
9. PostHog + Sentry wired on the core funnel (view -> save -> submit -> subscribe).
10. Legal minimum shipped: Privacy Policy, Terms of Service (with liability
    disclaimer), and a visible safety/access disclaimer on every location detail page.
11. CI green (lint/typecheck/build), deployed, and reachable at a public URL.
12. A "Founder Action Required" checklist for anything only the founder can complete
    (see bottom of this doc).

## Data model sketch (starting point — Fable owns the final schema)

- `location`: id, slug, name, feature_type (enum: cave | waterfall | hot_spring |
  other), geog (`geography(Point, 4326)`), elevation_m nullable, description,
  difficulty_tier (enum: easy | moderate | hard | technical), difficulty_notes,
  access_type (enum: public_land | private_land_permission_required | unclear),
  season_notes, hazard_notes (required — safety/liability), source (enum: osm | usgs |
  nps | wikidata | user_submitted), source_ref, moderation_status (enum: verified |
  community | pending | rejected), created_at, updated_at.
- `location_media`: id, location_id, cloudinary_url, credit, uploaded_by,
  moderation_status.
- `location_report`: id, location_id, user_id nullable, report_type (enum:
  condition_update | closure | incorrect_info | hazard | flowing_status |
  crowd_level), body, reported_at, staleness/expiry window for surfacing.
- `user_location_state`: user_id, location_id, saved boolean, visited boolean,
  personal_note, updated_at. Never fold into `location`.
- `subscription`: synced from Stripe via webhook — user_id, stripe_customer_id,
  stripe_subscription_id, status, plan (monthly | annual | lifetime),
  current_period_end.
- RLS: public read on `location`/`location_media` where `moderation_status` in
  (verified, community); authenticated write on `location`/`location_report` lands in
  `pending`; only service role/admin promotes to `verified`; users read/write only
  their own `user_location_state` and `subscription` rows.

## Core user flows to ship

1. **Discover** — map view (clustered Mapbox pins), filter by feature type /
   difficulty / distance-from-me, list-view fallback, search by name/place.
2. **Detail** — photos, description, difficulty, hazard/access notes, last-verified
   freshness indicator, recent community reports, directions deep-link, save button.
3. **Submit new location** — authenticated users propose a pin (name, coordinates via
   map-pick or device GPS, type, photos) -> lands in `pending`, not public until
   reviewed.
4. **Report condition/issue** — authenticated users post a dated report against an
   existing location (e.g. "waterfall dry," "road washed out," "crowded") -> surfaces
   on the detail page with a timestamp and staleness indicator.
5. **Save / My Spots** — personal saved list, persists via `user_location_state`.
6. **Auth** — Clerk sign-up/sign-in.
7. **Paywall** — concrete, server-enforced free vs. premium split. Suggested default:
   free = map browsing + basic pin info + up to N saved spots; premium ($4.99/mo) =
   full hazard/access detail, unlimited saves/collections, ad-free, unlimited report
   submissions, early access to newly verified locations. Fable finalizes exact
   gating and copy, but it must be real and enforced server-side, not just visually.
8. **Moderation** — a minimal protected internal view to approve/reject pending
   locations and reports. Does not need to be a separate app.

## Monetization implementation

- Stripe Billing (Checkout + Customer Portal), **not** Stripe Connect.
- Products/prices: Monthly $4.99 (default, most prominent), Annual (discounted),
  optional Lifetime one-time (secondary upsell only). Exact pricing/copy within this
  range is Fable's call.
- Webhook-synced subscription status is the only source of truth for entitlement
  checks — never trust client-side state for gating.
- Stripe account/product creation requires the founder's own dashboard access and the
  Stripe MCP tool in this environment is not authorized for headless use — build
  against `STRIPE_*` env vars and list exact manual setup steps under Founder Action
  Required rather than blocking on them.

## Data acquisition and seeding (this is core product content, not disposable dev-seed)

- Primary source: OpenStreetMap via the Overpass API — query tags `natural=cave`,
  `waterway=waterfall`, `natural=hot_spring`, `natural=spring`.
- Supplementary: USGS GNIS (feature classes Falls, Cave, Spring), National Park
  Service API (park-affiliated features with richer descriptions/permit info),
  Wikidata SPARQL (notable named features with images/descriptions).
- Pipeline: a repeatable ingestion script (mirror the `ops:seed-*` pattern used in
  sibling repos, e.g. Sweepza's `scripts/seed-dev-listings.mjs`) that fetches,
  normalizes, deduplicates (proximity + name-similarity), assigns a default
  difficulty heuristically, stamps `source`/`source_ref`, and sets
  `moderation_status = community` (not `verified`) pending human review.
- Target initial coverage: enough real, correctly-located features that the map is
  not empty at launch — aim for several hundred to low thousands of features across a
  defensible initial geography (e.g. a handful of states) rather than a token
  nationwide sprinkle.
- Licensing: OSM data is ODbL — ship a visible attribution/about page crediting
  OpenStreetMap contributors. USGS/NPS/Wikidata are public domain/open, but still
  credit sources on the about page.

## Safety, trust, and legal (launch-blocking, not optional)

- This product sends real people to potentially hazardous natural locations
  (drowning risk at waterfalls/swimming holes, cave collapse/entrapment risk,
  scalding risk at hot springs, remote/no-cell-service terrain) and to land that may
  be private or access-restricted.
- Every location detail page must carry a visible hazard/access disclaimer and a
  general "explore at your own risk, verify current conditions, respect private
  property and leave no trace" notice.
- Terms of Service must include a liability disclaimer; Privacy Policy must cover
  device GPS / location-data handling.
- Community reports and new submissions must go through moderation before public
  visibility — never auto-publish user-submitted pins or reports.

## Non-goals for this pass (explicit scope discipline)

- No native iOS/Android app yet — ship as a mobile-first responsive web app /
  installable PWA. Native App Store wrap is a deliberate phase 2; do not start it now.
- No offline map-tile caching — not reliably achievable on web without a native SDK;
  do not let it block launch.
- No host/creator marketplace, no Stripe Connect, no payouts.
- No complex social graph (follows/DMs) — simple reports/reviews are enough.
- No deep multi-tenant admin app — a minimal protected moderation view is enough.

## Execution directives for Fable

- Read this file once. Do not re-derive it, re-audit it, or produce an
  options-comparison memo — the decisions above are final for this pass.
- Provision real infrastructure wherever tool access allows: Vercel and Supabase MCP
  tools are available in this environment — use them to create the actual
  project/database rather than only writing config for someone else to run later.
- Clerk and Stripe require founder-owned dashboard accounts and are not reachable
  headlessly from here — build against env var placeholders in `.env.example` and
  produce one concise Founder Action Required checklist instead of blocking on them.
- Delegate mechanical/parallelizable work (geodata ingestion scripts, repeated
  CRUD/UI scaffolding, seed pipelines, boilerplate config) to subagents; keep your
  own attention on schema correctness, entitlement/payment logic, RLS, and
  integration wiring.
- Founder-authorized exception for this pass only (see `AGENTS.md`): iterate and
  commit continuously on `main` rather than gating every slice behind a separate
  PR/review cycle — speed to a real, working, monetizable product is the priority.
  Resume normal branch/PR discipline once the app is live.
- Never commit real secrets; use `.env.example` and document the Doppler/Vercel env
  sync path.
- At completion, produce exactly **one** short report: what is live, the production
  URL, the Founder Action Required checklist, and any known gaps. Do not narrate the
  build process.

## Founder action required

Fable: fill in the specifics as you build (exact dashboard steps, exact env var
names already scaffolded in `.env.example`). Founder: complete these — they cannot
be done headlessly from this environment.

- [ ] Clerk: create application, configure redirect URLs, paste publishable/secret
      keys.
- [ ] Stripe: create account/products (Monthly $4.99, Annual, optional Lifetime),
      paste publishable/secret/webhook-signing keys, configure webhook endpoint.
- [ ] Mapbox: create account/token.
- [ ] Cloudinary: create account/credentials.
- [ ] Confirm whether to reuse org-shared PostHog/Sentry projects or create new ones
      for this app.
- [ ] Resend: create API key + verified sending domain.
- [ ] Point a production domain at the Vercel project; add secrets to Doppler.

## Bottom line

There is nothing to preserve and nothing to converge — this is a clean build. The
job is to go from an empty repo to a live, real-data, real-auth, real-payments,
production map product in one continuous pass, using the same integration spine as
the rest of the portfolio, without stopping to re-litigate decisions already made in
this document.
