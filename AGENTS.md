<!-- ae-control-plane v1 (2026-07-16). Machine operating contract; product docs follow below. -->
# Operating contract — Automated Empires control plane

- **Canonical clone (the ONLY writable copy):** WSL `Ubuntu-24.04-Recovered` → `/home/jackson/automatedempires/ventures/pinnedatlas`.
  Never clone this repository anywhere else on the machine. Parallel work uses controlled
  worktrees: `ae start pinnedatlas -t <task> -a <agent> --worktree`.
- **Sessions:** acquire the single-writer lease first (`ae start pinnedatlas -t <task> -a <agent>`);
  end with `ae finish pinnedatlas`. Work counts as done ONLY when pushed and remote-SHA-verified.
- **Deploys:** merging `main` auto-deploys production via Vercel — **LIVE at pinnedatlas.com**.
- **Validate before merge:** `pnpm typecheck && pnpm lint` (CI must be green; squash merges).
- **Providers (fixed — never swap or cross-wire):** db=supabase, auth=clerk (accounts built but DORMANT), payments=stripe (built but DORMANT — machine Stripe auth resolves to E&E, do not commingle), maps=map provider (data-quality pass 2026-07-13).
- **LOCKED:** Free product stays free until founder activates paid; do not enable Stripe/accounts
- **LOCKED:** Never use E&E's Stripe credentials here
- **Warn before:** MERGING TO MAIN DEPLOYS pinnedatlas.com
- **Warn before:** enabling payments or accounts
- Full policy: `github.com/AutomatedEmpires/ae-control` → `POLICY.md`. Briefing: `ae info pinnedatlas`.

---

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
- **Map runtime (dated decision 2026-07-07):** the org spine names Mapbox, but the map is founder-mandated to be the landing experience and cannot be gated on a founder-provided token. Runtime uses **MapLibre GL JS + free CARTO dark vector tiles** (no token) by default, giving a working map-first product immediately. Mapbox remains an optional upgrade (swap `STYLE_URL` in `components/map-explorer.tsx` + add a token transform). Attribution (OSM + CARTO) renders via the map's attribution control.
- One canonical `location` object drives map pin, detail page, search, submission, and moderation. Never fork parallel location models for seeded vs. user-submitted data.
- User-specific state (saved/favorited, visited, personal notes) lives in `user_location_state`, never on `location`.
- Controlled values (`feature_type`, `difficulty_tier`, `access_type`, `moderation_status`, report reason) come from enums/dictionaries — no free text for these fields.
- Free vs. premium gating is enforced server-side against Stripe subscription status synced via webhook — never client-only.