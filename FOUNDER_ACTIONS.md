# PinnedAtlas — Founder Action Required

**Bottom line:** PinnedAtlas is an **operating free product** right now at
https://pinnedatlas.com — map-first discovery of thousands of caves, waterfalls,
hot springs, and springs works with no founder action. Nothing below blocks the
current product from serving real visitors. The items here unlock *additional*
features (accounts, payments, richer analytics) and are optional or future.

Each item lights up its feature with no code change — just env vars + redeploy
(`vercel env add <NAME> production` then push/redeploy; long-term put values in
Doppler project `pinnedatlas` config `prd` and run
`./scripts/sync-vercel-env-from-doppler.sh`).

---

## ✅ Already done (no action)

- **Domain** — `pinnedatlas.com` + `www` live over valid SSL/HSTS; `www` 308-redirects
  to the apex; canonical/OG/sitemap now use the owned domain.
- **Supabase** — project `mrizaiftntoznmwhulwc` (us-east-1): PostGIS schema + RLS
  applied, real geodata ingested, env wired into Vercel.
- **Map** — MapLibre GL + free CARTO dark tiles (no token). Map-first landing with
  a Zillow-style viewport-synced listing panel. **Mapbox is optional**, not a
  blocker — swap the one `STYLE_URL` constant in `components/map-explorer.tsx` if
  ever wanted.
- **Analytics instrumentation** — product events (`map_opened`, `viewport_changed`,
  `filter_applied`, `search_used`, `list_opened_mobile`, `spot_opened`) are wired
  and privacy-conscious (zoom + counts only, never coordinates). They start
  flowing the moment a PostHog key is set (see below).

---

## Optional / future founder gates

### A. Analytics activation — OPTIONAL (recommended)
The instrumentation is built; it just needs a destination project.
- [ ] Create a **dedicated** PostHog project named `pinnedatlas` at
      https://us.posthog.com (the MCP cannot create projects, and PinnedAtlas must
      NOT reuse the `exploreandearn` project — that would mix two products' data).
- [ ] Set `NEXT_PUBLIC_POSTHOG_KEY` (the project's `phc_…` token) and
      `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` → redeploy. Events verify
      immediately.

### B. Error monitoring — OPTIONAL (recommended)
- [ ] Sentry is not installed and its connector needs interactive OAuth (not
      possible headlessly). Either authorize the Sentry connector in an
      interactive session, or create a Sentry project and provide the DSN; then we
      add `@sentry/nextjs` + `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`. Until then,
      server error visibility = Vercel runtime logs (adequate for launch).

### C. Accounts (Clerk) — OPTIONAL (only unlocks secondary features)
The **entire core product (map, browse, search, detail) is public and needs no
auth.** Clerk only gates saving spots, a visit log, personal notes, submitting a
new location, reporting conditions, admin moderation, and premium. None are
required to operate.
- [ ] Create a Clerk application at https://dashboard.clerk.com, add the
      production domain, set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`.
- [ ] Put your Clerk user id (`user_…`) in `ADMIN_USER_IDS` to unlock
      `/admin/moderation`.

### D. Payments (Stripe) — FUTURE (monetization is built but dormant)
The paid-access flow is fully implemented (pricing page, server-enforced
entitlements, checkout, customer portal, webhook sync) but **inactive** — the
free product does not require it, and premium also depends on Clerk (C). Provision
only when you want to turn on monetization.
- [ ] Create prices under one product: Monthly $4.99 → `STRIPE_PRICE_ID_MONTHLY`,
      Annual $39.99 → `STRIPE_PRICE_ID_ANNUAL`, Lifetime $99 → `STRIPE_PRICE_ID_LIFETIME`.
- [ ] `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- [ ] Webhook → `https://pinnedatlas.com/api/webhooks/stripe`, events
      `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`
      → `STRIPE_WEBHOOK_SECRET`. Enable the Customer Portal.

### E. Legal — do before enabling payments at scale
- [ ] Counsel-confirm the governing-law placeholder in `/legal/terms` (Texas,
      clearly marked) and the `legal@`/`privacy@pinnedatlas.com` contact addresses
      (placeholders — set up mailboxes or change).

---

## Notes
- Cloudinary + Resend are scaffolded in `.env.example` but unused (photo upload +
  email are the next iteration).
- OSM (ODbL) + CARTO attribution obligations are satisfied: OSM/USGS/NPS/Wikidata
  credited at `/about`, and the map's attribution control shows OSM + CARTO.
- Supabase advisory: `public.spatial_ref_sys` (a PostGIS system table) reports RLS
  disabled — expected for PostGIS; do not "fix" without confirming PostGIS needs.
