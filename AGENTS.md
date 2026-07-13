# PinnedAtlas — Agent Operating Contract

This contract is binding for every contributor and agent working in this repository. Snapshot facts are dated 2026-07-12; refresh PR and rollout status before acting.

## 1. App purpose

PinnedAtlas is a map-first, mobile-first product for discovering natural features such as caves, waterfalls, and hot springs. `FABLE5_BUILD_BRIEF.md` remains a source for product, model, and design intent only. This `AGENTS.md` overrides any brief language permitting direct work on `main`, provider provisioning, production geodata ingestion, deployment, or live payment activation. One canonical `location` object must drive map pins, detail pages, search, submission, and moderation; personal saved, visited, and note data belongs in `user_location_state`; and controlled values must use the established enums or dictionaries rather than free text.

Because the product can route people to physical hazards or restricted property, safety, trespass, access, and legal warnings are launch-blocking requirements.

## 2. Business vision

Build an accessible natural-feature discovery experience that earns trust through accurate map context, honest data coverage, visible attribution, safe access guidance, and clear limits. Premium subscriptions may eventually support the product, but discovery, safety, legal, entitlement, refund, and payment rules must be approved before monetization.

## 3. Current rollout status

Status: active zero-to-one codebase; off-registry classification unresolved. As of 2026-07-12 there are no open PRs, and the product is not money-ready or transfer-ready. Refresh PRs, registry classification, ownership, and rollout status before acting.

## 4. Branch naming rules

- Before work, run `git status -sb` and `git branch --show-current`, then inspect open PRs and owned artifacts.
- Agent branches use `agent/<scope>-<short-description>`.
- Normal work may use `feat/`, `fix/`, `docs/`, or `chore/` followed by a short kebab-case scope.
- One agent owns one artifact and one branch at a time. Do not start from a branch containing unrelated changes or overwrite another agent's artifact.
- All work uses branches, PRs, and independent review. The former direct-to-`main` exception is revoked. Implementing agents/builders never push directly to `main`, merge their own PRs, or delete unmerged branches. A designated maintainer or approved automation may merge after independent review and green required checks, then delete the merged branch.
- Use durable issues, PRs, or repository documentation for handoff.

## 5. Required checks before PR

- Use Node `24.16.0`, pnpm `10.12.4`, and TypeScript strict mode. A toolchain change requires a dated approved decision.
- Run `pnpm install --frozen-lockfile`.
- Run `pnpm validate`.
- Run `git diff --check`.
- Review the diff for scope, safety and legal regressions, attribution, canonical data-model consistency, and honest fallback behavior.
- Geodata ingestion commands are operational actions, never routine tests. Do not run them as validation.

## 6. Forbidden actions

- Do not push to `main`, self-merge or bypass independent review, delete unmerged branches, overwrite another agent's artifact, or work from a branch with unrelated changes.
- Do not deploy, promote, link projects, change environments, domains, DNS, or provider configuration.
- Do not run live geodata ingestion, production database writes, destructive migrations, or routine commands against production systems.
- Do not weaken physical-safety, trespass, access, legal, licensing, attribution, moderation, auth, payment, or entitlement controls.
- Do not fork parallel location models, store user-specific state on `location`, or replace controlled enums with free text.
- Do not expose secrets, private user data, private locations, cookies, tokens, sensitive provider IDs, or recovery material.

## 7. Provider no-touch zones

Provider no-touch means no dashboard, CLI, or API writes. It covers Doppler; Vercel; Supabase/PostGIS; Clerk; Stripe; Resend and DNS; MapLibre, CARTO, and Mapbox; Cloudinary; Sentry and PostHog; and geodata source APIs. Do not deploy, promote, link, change environment variables, domains, or DNS, alter secrets, run live migrations or SQL, change auth/storage, create charges/products/prices/webhooks/refunds/payouts, send email, change telemetry/media, or write to source APIs. Read-only provider inspection requires explicit scope.

## 8. Data, money, email, and auth guardrails

- Do not perform live geodata ingestion or production database mutations.
- Use authoritative or open sources for public geodata and preserve all licenses and attribution. OpenStreetMap data requires visible OSM/ODbL attribution.
- Do not ingest private locations or expose sensitive or hazardous locations without an approved safety policy.
- Payments are limited to Stripe Billing and subscriptions. There is no Stripe Connect and there are no payouts. Do not activate live subscriptions or charges until legal, safety, entitlement, refund, and payment rollout approval is recorded.
- Do not activate live Clerk or Resend, alter production auth, or send email.
- Never commit, log, paste, or expose secrets, private user data, private locations, cookies, tokens, sensitive provider IDs, or recovery material.

## 9. Design notes

Preserve the map-first landing experience, mobile accessibility, and the dated MapLibre GL JS plus free CARTO dark vector tile runtime decision. Mapbox remains only an optional future upgrade. Keep attribution visible, including OSM and CARTO where applicable. Empty, loading, error, and fallback states must be honest. Do not redesign the product while performing scoped work.

## 10. Current known PRs and blockers

Snapshot date: 2026-07-12. There are no open PRs. The unresolved blocker is founder classification of this existing but off-registry repository. The product is not money-ready or transfer-ready; physical safety, trespass/legal guidance, provider governance, entitlement/refund policy, and rollout approvals remain gating concerns. Refresh all facts before acting.

## 11. Output format for future agents

Every PR or handoff must report:

- Branch name and HEAD commit.
- Files changed and exact scope.
- Exact checks run and their results, including checks not run and why.
- Provider, source-API, ingestion, database, or other live-system actions; normally state `none` explicitly.
- Risks and blockers, including safety, legal, attribution, and data concerns where relevant.
- PR URL.
- For UI work, screenshots and accessibility notes.
