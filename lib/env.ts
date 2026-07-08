// Central environment contract. Every integration degrades gracefully when its
// keys are absent so the app builds and deploys before all providers are wired.

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  stripePriceMonthly: process.env.STRIPE_PRICE_ID_MONTHLY ?? '',
  stripePriceAnnual: process.env.STRIPE_PRICE_ID_ANNUAL ?? '',
  stripePriceLifetime: process.env.STRIPE_PRICE_ID_LIFETIME ?? '',
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '',
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? '',
  anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5',
  adminUserIds: (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
export const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);
export const hasStripe = Boolean(env.stripeSecretKey);
export const hasPostHog = Boolean(env.posthogKey);
export const hasAnthropic = Boolean(env.anthropicKey);
