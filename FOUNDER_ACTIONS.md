# PinnedAtlas — Founder Action Required

Everything below needs founder-owned dashboard access and cannot be completed
headlessly. The app is built, deployed, and degrades gracefully — each item you
complete lights up its feature with **no code change**, just env vars + redeploy.

After adding any env var: `cd ventures/pinnedatlas && vercel env add <NAME> production`
(or use the Vercel dashboard → pinnedatlas → Settings → Environment Variables),
then redeploy (`vercel --prod` or push to main). Long-term, put values in Doppler
(project `pinnedatlas`, config `prd`) and run `./scripts/sync-vercel-env-from-doppler.sh`.

## 1. Supabase — ✅ DONE
Project `pinnedatlas` (ref `mrizaiftntoznmwhulwc`, us-east-1) is live: schema +
RLS applied, real geodata ingested, env wired into Vercel production. Nothing
left to do here.

## 2. Clerk (unblocks accounts, saves, submissions, premium)
- [ ] Create an application at https://dashboard.clerk.com (name: PinnedAtlas).
- [ ] Add the production domain under Domains.
- [ ] Copy keys → Vercel env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
- [ ] After first sign-in, copy your Clerk user id (starts `user_`) into
      `ADMIN_USER_IDS` env var to unlock `/admin/moderation`.

## 3. Stripe (unblocks payments)
- [ ] In https://dashboard.stripe.com create three prices under one product
      ("Atlas Premium"):
      - Monthly recurring $4.99 → `STRIPE_PRICE_ID_MONTHLY`
      - Yearly recurring $39.99 → `STRIPE_PRICE_ID_ANNUAL`
      - One-time $99 → `STRIPE_PRICE_ID_LIFETIME`
- [ ] Developers → API keys → `STRIPE_SECRET_KEY` (+ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
- [ ] Developers → Webhooks → Add endpoint:
      `https://<production-domain>/api/webhooks/stripe`
      Events: `checkout.session.completed`, `customer.subscription.created`,
      `customer.subscription.updated`, `customer.subscription.deleted`
      → copy signing secret → `STRIPE_WEBHOOK_SECRET`.
- [ ] Enable the Customer Portal (Settings → Billing → Customer portal).

## 4. Mapbox (unblocks the interactive map — until then the app auto-falls back to list browsing)
- [ ] Get a public token (pk.…) at https://account.mapbox.com/access-tokens/
      (or reuse the org token already used by Explore & Earn — same spine).
- [ ] → `NEXT_PUBLIC_MAPBOX_TOKEN`. Recommended: URL-restrict it to the production domain.

## 5. Observability (recommended, not launch-blocking)
- [ ] PostHog: create project "pinnedatlas" (or reuse org project) →
      `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.
- [ ] Sentry: optional at this stage; wire later per org standard.

## 6. Domain
- [ ] Point a production domain (e.g. pinnedatlas.com) at the Vercel project:
      Vercel dashboard → pinnedatlas → Settings → Domains.
- [ ] Set `NEXT_PUBLIC_APP_URL=https://<domain>` env var (used for Stripe
      redirect URLs, sitemap, robots).

## 7. Legal (before real payments at scale)
- [ ] Have counsel confirm the governing-law placeholder in `/legal/terms`
      (currently Texas, clearly marked) and the contact emails
      (legal@/privacy@pinnedatlas.com placeholders — set up mailboxes or change).

## Notes
- Cloudinary + Resend are scaffolded in `.env.example` but no feature currently
  requires them (photo upload + email are the next iteration).
- OSM attribution obligations (ODbL) are already satisfied at `/about`.
