# PinnedAtlas — Venture Operating Contract

This contract is binding for every contributor and agent in this repository. `FABLE5_BUILD_BRIEF.md` remains a source for product, model, and design intent; this contract governs safe execution, branch practice, provider boundaries, and portfolio classification.

## Portfolio classification

PinnedAtlas is **active but off-registry**. It is not currently one of the seven canonical AutomatedEmpires ventures unless the founder explicitly reclassifies it.

- Preserve the repository and complete assigned PinnedAtlas work well.
- Do not spend major unassigned execution time on it.
- Do not add it to canonical portfolio counts, status boards, provider maps, shared budgets, or primary venture documentation as if it were registry-approved.
- Do not let its providers, product assumptions, or data model become defaults for canonical ventures.
- Classification is not a request to delete or abandon the project; it is a prioritization boundary.

## Operating doctrine

When PinnedAtlas work is assigned, agents are expected to ship meaningful improvements, not produce endless audits. Prefer tested, reviewable changes over reports. Use protected previews, synthetic/test data, reversible branches, sandbox payments, and isolated geodata fixtures aggressively. Stop only for destructive, paid, live-money, legal, DNS, credential, ownership, MFA, or public-launch actions listed below.

Off-registry status limits unsolicited priority, not execution authority within an assigned task.

## Venture thesis

Natural-feature discovery is fragmented, poorly contextualized, and often unsafe. PinnedAtlas can become a mobile-first, map-first field guide for caves, waterfalls, hot springs, springs, and related features by combining accurate locations, visible provenance, current conditions, difficulty/access guidance, community reports, and honest safety limits.

The differentiator is not a large pin count. It is confidence about **whether a place is worth visiting now, how hard it is to reach, what access constraints apply, and where the information came from**.

## Primary user and buyer

- **Primary user:** an outdoor explorer deciding what natural feature to visit and planning around access, conditions, distance, and difficulty.
- **Contributing user:** a signed-in person submitting a location, report, photo, or condition update for moderation.
- **Potential buyer:** a repeat explorer who may eventually pay for premium planning, saving, offline, or organization features through a subscription—never for safety-critical truth.

People may reach physical hazards, restricted land, or sensitive locations based on this product. Safety and access context must work for anonymous/free users.

## What the product must become

PinnedAtlas should become:

- a fast map-first discovery experience with synchronized list, search, filter, collection, and location-detail views;
- a canonical `location` model that drives every public surface rather than parallel pin records;
- a trustworthy Conditions Engine that explains weather, daylight, season, flow/closure risk, and data freshness instead of presenting a magic score;
- a provenance-aware geodata pipeline with moderation, deduplication, attribution, and safe treatment of sensitive locations;
- a field guide with difficulty, access, ownership, hazard, and “turn back” guidance;
- a resilient mobile/offline experience for low-signal areas;
- a clear free product with optional subscription entitlements only after the legal/payment model is approved.

Personal saved, visited, note, and trip state belongs in `user_location_state` or its established user-state boundary. Controlled values use repository enums/dictionaries rather than free text.

## Current stage

As of 2026-07-12, the portfolio has **zero real PinnedAtlas users/customers**. The repository is a substantial zero-to-one product with map discovery, source ingestion, moderation, conditions, weather, collections, offline foundations, auth/payment fallbacks, and tests. It is not money-ready or registry-integrated.

The repository's GitHub Dependency Graph is disabled, so the `dependency-review` workflow fails before reviewing the docs-only diff. Enabling that repository setting is an administrator decision, not a code fix.

This is pre-user product validation. Preserve physical-safety, access, source, and licensing boundaries while iterating quickly on routes, data contracts, map UX, and test fixtures.

## Execution authority — act without founder approval

For an assigned PinnedAtlas task, agents may independently:

- fix code, tests, accessibility, map behavior, performance, security findings, dependencies, CI, and documentation;
- improve discovery, search, filters, collections, location details, Conditions Engine explanations, offline behavior, and honest fallbacks;
- refactor app-local code while preserving the canonical location/user-state boundaries;
- add or improve geodata parsers, deduplication, provenance, moderation, safety validation, and source-license tests using fixtures;
- run ingestion logic against local fixtures or isolated/dev/preview databases, never live production stores;
- create and test non-destructive migrations in local/dev/preview lanes;
- create synthetic locations/reports/users, static assets, validation scripts, seed/demo data, and internal smoke tests;
- use Stripe test mode for entitlement/subscription architecture and non-customer internal email tests;
- create protected preview deployments in already-configured non-billing lanes;
- remove dead pre-launch paths or change pre-user schemas/routes when tests and migration notes support it;
- open/update a reviewable PR and address review or CI feedback.

Do not wait for founder permission for ordinary reversible implementation. Do not begin a major unassigned roadmap initiative merely because the repository exists.

## True hard stops — founder approval required

Stop before any of the following:

- upgrading a paid provider plan or accepting a new recurring cost;
- buying a domain or performing a DNS/domain cutover;
- activating live money, creating real charges/subscriptions, capturing/refunding funds, or enabling production billing;
- destructively deleting a provider project, database, storage bucket, media library, environment, deployment history, or source resource;
- running a destructive production-database migration, destructive live ingestion, or destructive cleanup;
- revoking or rotating credentials, secrets, signing keys, recovery codes, or tokens;
- transferring repository, provider, domain, or account ownership;
- making a public launch announcement or presenting the product as publicly launched;
- purchasing ads, starting campaigns, or sending marketing broadcasts;
- filing legal documents or accepting legal/source/provider terms on the founder's behalf;
- completing an action that requires MFA when the founder is unavailable.

A hard stop blocks only that action. Build and verify the implementation, sandbox flow, migration plan, safety checklist, or launch packet so the decision is narrow.

## High-value work to prioritize

When work is assigned, prioritize:

1. Accurate canonical location data, source attribution, deduplication, and moderation.
2. Map/list synchronization, search/filter quality, mobile performance, and honest empty/loading/error fallbacks.
3. Explainable conditions, freshness, closure/access evidence, and safety context.
4. Offline/low-signal reliability and accessibility for field use.
5. User-state isolation, authorization, report moderation, rate limiting, and abuse resistance.
6. Focused tests for geospatial, entitlement, conditions, source-license, and safety logic.
7. Test-mode subscription architecture that never hides safety-critical information.
8. Documentation that clarifies off-registry status and prevents provider/portfolio contamination.

## Low-value work to avoid

- Unassigned portfolio integration, provider migration, budget work, or roadmap expansion.
- Chasing raw pin count through low-quality ingestion, duplicated sources, or unsafe sensitive-location publication.
- Generic outdoors lifestyle content, gamification, social feeds, or “AI guide” polish ahead of source and safety quality.
- Treating the Conditions score as certainty or hiding stale/missing inputs.
- Building live billing, payouts, advertising, or marketplace mechanics before registry and legal decisions.
- Replacing an assigned implementation with another broad audit.
- Replatforming the map/design stack or redesigning the entire product from a focused task.

## Provider boundaries

Known provider/source surfaces include Doppler, Vercel, Supabase/PostGIS, Clerk, Stripe Billing, Resend/email/DNS, MapLibre/CARTO, optional Mapbox, Cloudinary, Sentry, PostHog, OpenStreetMap/Overpass, USGS GNIS, Open-Meteo, and other documented public-source APIs.

Agents may use established local, sandbox, test, isolated, and protected-preview resources within an assigned task. Repository configuration, provider adapters, preview-safe validation, and fail-closed fallbacks are normal implementation. Never reveal secret values or borrow another venture's project, sender, account, or data.

Production provider writes are controlled operations. Do not change live domains/DNS, billing, RBAC, recovery, production environments, production auth, live webhooks/senders, source-provider terms, or ownership without the applicable hard-stop approval. Preparing exact provider steps and validation is allowed.

MapLibre with CARTO vector tiles is the established runtime direction; Mapbox is an optional future upgrade, not a missing dependency to provision casually. Missing keys must preserve honest signed-out, list, empty-data, and “payments unavailable” fallbacks.

## Data, safety, legal, money, email, and auth boundaries

### Geodata and sources

- Prefer authoritative or licensed open sources and preserve provenance, source IDs, retrieval date, verification state, and attribution.
- OpenStreetMap-derived data requires visible OpenStreetMap/ODbL attribution; preserve other source licenses exactly.
- Do not ingest private locations, personal data, unpublished access instructions, or sensitive sites without an approved safety policy.
- Community submissions remain moderated before publication. Do not convert “submitted” into “verified.”
- Keep one canonical `location` model. Do not store user-specific state on public location records or fork parallel location shapes.
- Local/dev/preview migrations and ingestion must be reversible and fixture-backed. Destructive production work is a hard stop.

### Physical safety and access

- Never claim a route, cave, water feature, road, parking area, or property is safe, legal, open, or accessible without current evidence.
- Show data freshness and encourage users to verify closures, ownership, weather, water, terrain, and skill requirements.
- Do not expose sensitive ecological, cultural, private, or high-risk coordinates merely to increase coverage.
- Safety-critical access/context stays available without a paid subscription.

### Money

- The current payment model is Stripe Billing/subscriptions only; there is no Stripe Connect and no payout flow.
- Stripe test mode is available for development. Live products/prices, subscriptions, captures, refunds, or production portals are hard stops until product, legal, entitlement, refund, and payment decisions are recorded.

### Email and auth

- Internal delivery tests may use venture-scoped test recipients and synthetic users.
- Do not activate a sender/domain or send real marketing/user email without the applicable approval.
- Clerk fallbacks must remain fail-safe. Do not weaken authorization, expose private user state, or provision production users from a coding task.

### Privacy and secrets

Never commit, log, paste, screenshot, or expose secrets, cookies, tokens, private user data, private notes, precise sensitive locations, provider identifiers that confer access, or recovery material.

## Design notes

Preserve the mobile-first, map-first Frontier Field Guide direction: dark terrain-aware surfaces, legible pins, visible map attribution, synchronized discovery panels, and compact field-use interactions. Conditions and safety information should be explainable, not decorative.

Design improvement is welcome within assigned scope. Do not replace the established product identity, hide provenance, introduce a generic travel marketplace aesthetic, or perform an incidental full redesign.

## Branch and multi-agent coordination

- Start from current `main`; never push directly to `main`.
- Agent branches: `agent/<scope>-<short-description>`.
- Other branches: `feat/<short-description>`, `fix/<short-description>`, `docs/<short-description>`, or `chore/<short-description>`, in kebab-case.
- Before editing, run `git status -sb`, record branch/HEAD, inspect open PRs/issues, and identify overlapping artifacts.
- One owner per task/branch/artifact. Coordinate rather than overwriting migrations, ingestion outputs, generated data, or another agent's changes.
- Implementers do not merge their own PRs, force-push shared work, or delete unmerged branches. A designated maintainer or approved automation may merge after independent review and green required checks.
- Durable handoff belongs in issues, PRs, or repository docs—not only chat.

## Testing and PR requirements

Use Node `24.16.0`, pnpm `10.12.4`, TypeScript strict mode, and the repository's locked dependencies:

```text
pnpm install --frozen-lockfile
pnpm validate
git diff --check
```

`pnpm validate` runs lint, typecheck, tests, and build. Use focused tests during iteration. Map/UI work requires screenshots at relevant mobile/desktop widths plus keyboard/accessibility review. Geodata, conditions, entitlement, auth, moderation, and safety changes require focused regression tests and fixture/source review.

For Markdown-only work, `git diff --check` and focused Markdown/link review are sufficient; state why app checks were skipped. `ops:ingest-overpass`, `ops:ingest-gnis`, promotion scripts, and provider-sync commands are operational actions, not routine validation. Never aim them at live state to make a PR green.

PRs must explain product outcome, portfolio-classification impact, source/data/safety implications, checks, and any true hard stop. Keep provider activation and launch operations out of ordinary product PRs.

## Definition of done

Work is done when:

- the assigned explorer/moderator outcome works end to end, including loading, missing-data, stale, offline, and error states;
- canonical location/user-state boundaries and source attribution remain coherent;
- physical-safety, access, licensing, and sensitive-location implications were reviewed;
- focused tests and all relevant required checks pass;
- no secrets, private data, unsupported access claim, real charge, or real send was introduced;
- ingestion/migrations are fixture-backed and include rollback or forward-fix notes;
- UI changes include mobile/desktop and accessibility evidence;
- the PR is scoped, independently reviewable, and does not imply canonical-portfolio status.

An audit, pin count, passing unit test, map screenshot, or provider URL alone is not done.

## What not to overprotect at zero users

PinnedAtlas has no real users/customers to migrate. Do not use hypothetical “customer impact” to freeze pre-launch routes, schemas, test locations, conditions logic, map controls, plan names, or entitlement structures. Reversible assigned changes should move quickly through preview and review.

Still protect source licenses, physical safety, private/sensitive locations, secrets, live resources, and public claims. Zero users lowers migration cost; it does not justify dangerous geodata.

## Current known PRs and blockers

Refreshed 2026-07-13 UTC:

- Draft PR #2, `docs: add agent operating standards`, is the only open PR and is this branch.
- The GitHub Dependency Graph is disabled. The required `dependency-review` job therefore fails with “Dependency review is not supported on this repository.” An administrator must decide whether to enable the repository setting or change the required-check policy; application code cannot repair it.
- Founder registry classification remains unresolved beyond the operating classification in this file: active but off-registry and outside the seven canonical ventures unless confirmed otherwise.
- Live money, public launch, safety/access policy, provider governance, and entitlement/refund decisions remain unapproved.

The dependency setting blocks a fully green required-check result, not continued docs/code work or independent review.

## Output format for future agents

Every final handoff must report:

1. branch, HEAD, assigned task/acceptance criteria, and product sources used;
2. exact files and explorer/moderator behavior changed;
3. checks run with pass/fail/skipped results and UI/accessibility evidence where relevant;
4. source/license/provenance, geodata, safety/access, and sensitive-location impact;
5. provider, deployment, DNS, data, money, email, auth, and portfolio-registry impact—state `none` explicitly where applicable;
6. assumptions, remaining blockers, rollback/forward-fix notes, and any true hard stop; and
7. PR URL/state or a statement that no PR was created.
