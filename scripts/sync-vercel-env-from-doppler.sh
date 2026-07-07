#!/usr/bin/env bash
# Sync secrets from Doppler (source of truth) to the Vercel project's
# production environment. Mirrors the org pattern used in sibling ventures.
#
# Usage: DOPPLER_PROJECT=pinnedatlas DOPPLER_CONFIG=prd ./scripts/sync-vercel-env-from-doppler.sh
set -euo pipefail

DOPPLER_PROJECT="${DOPPLER_PROJECT:-pinnedatlas}"
DOPPLER_CONFIG="${DOPPLER_CONFIG:-prd}"

VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  CLERK_SECRET_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  STRIPE_PRICE_ID_MONTHLY
  STRIPE_PRICE_ID_ANNUAL
  STRIPE_PRICE_ID_LIFETIME
  NEXT_PUBLIC_MAPBOX_TOKEN
  NEXT_PUBLIC_POSTHOG_KEY
  NEXT_PUBLIC_POSTHOG_HOST
  RESEND_API_KEY
  NEXT_PUBLIC_APP_URL
  ADMIN_USER_IDS
)

for var in "${VARS[@]}"; do
  value="$(doppler secrets get "$var" --project "$DOPPLER_PROJECT" --config "$DOPPLER_CONFIG" --plain 2>/dev/null || true)"
  if [ -z "$value" ]; then
    echo "skip  $var (not set in Doppler)"
    continue
  fi
  vercel env rm "$var" production --yes >/dev/null 2>&1 || true
  printf '%s' "$value" | vercel env add "$var" production >/dev/null
  echo "sync  $var"
done

echo "Done. Redeploy for changes to take effect: vercel --prod"
