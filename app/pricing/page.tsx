import type { Metadata } from 'next';
import Link from 'next/link';
import { getUserId } from '@/lib/auth';
import { getEntitlement } from '@/lib/billing/entitlements';
import { PLANS, PREMIUM_FEATURES, type Plan } from '@/lib/billing/plans';
import { CheckoutButton } from '@/components/checkout-button';
import { Icon } from '@/components/icon';
import { Reveal } from '@/components/reveal';
import { badgeClass, cardClass, cn } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Premium',
  description:
    'Upgrade to PinnedAtlas Premium: unlimited saves, trip log, personal notes, and advanced filters.',
};

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
  lifetime: 'Lifetime',
};

function SecondaryPlanCard({ plan, isSignedIn }: { plan: Plan; isSignedIn: boolean }) {
  return (
    <section
      aria-label={plan.name}
      className={cn(cardClass(), 'flex flex-col p-5 sm:p-6')}
    >
      <h3 className="text-sm font-semibold text-stone-200">{plan.name}</h3>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-semibold text-stone-50">{plan.priceLabel}</span>
        <span className="text-sm text-stone-400">{plan.cadenceLabel}</span>
      </p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-400">{plan.blurb}</p>
      <div className="mt-5">
        <CheckoutButton plan={plan.key} isSignedIn={isSignedIn} />
      </div>
    </section>
  );
}

export default async function PricingPage() {
  const userId = await getUserId();
  const entitlement = await getEntitlement(userId);
  const isSignedIn = Boolean(userId);

  const monthly = PLANS.find((p) => p.key === 'monthly') ?? PLANS[0];
  const secondary = PLANS.filter((p) => p.key !== monthly.key);

  return (
    <div className="mx-auto w-full max-w-content px-4 py-12 sm:px-6 lg:py-16">
      {/* Hero */}
      <header className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          PinnedAtlas Premium
        </span>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] text-stone-50 sm:text-5xl">
          Go further, off the map
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-stone-400">
          Save unlimited spots, log every visit, and unlock advanced filters — while supporting
          accurate, moderated location data.
        </p>
      </header>

      {entitlement.isPremium ? (
        <div
          role="status"
          className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-2xl border border-accent/40 bg-accent/[0.06] p-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent ring-1 ring-inset ring-accent/25">
            <Icon name="premium" size={20} weight="fill" />
          </span>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-stone-100">
              You are Premium ({PLAN_LABELS[entitlement.plan] ?? entitlement.plan})
            </p>
            <Link
              href="/account"
              className="text-accent underline underline-offset-2 hover:text-accent-strong"
            >
              Manage your account
            </Link>
          </div>
        </div>
      ) : null}

      {/* Featured monthly plan */}
      <section
        aria-label={monthly.name}
        className="relative mx-auto mt-10 max-w-md overflow-hidden rounded-3xl bg-surface-raised p-7 shadow-glow ring-2 ring-accent sm:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(closest-side,rgba(52,211,153,0.18),transparent)]"
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-stone-100">{monthly.name}</h2>
            <span className={badgeClass('topaz')}>
              <Icon name="premium" size={12} weight="fill" />
              Most popular
            </span>
          </div>
          <p className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-6xl font-semibold tracking-tight text-stone-50">
              {monthly.priceLabel}
            </span>
            <span className="text-sm text-stone-400">{monthly.cadenceLabel}</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-stone-300">{monthly.blurb}</p>
          <div className="mt-6">
            <CheckoutButton plan={monthly.key} isSignedIn={isSignedIn} />
          </div>
          <p className="mt-3 text-center text-xs text-stone-500">Cancel anytime — no lock-in.</p>
        </div>
      </section>

      {/* Secondary plans */}
      <div className="mx-auto mt-5 grid max-w-md grid-cols-1 gap-4 sm:max-w-2xl sm:grid-cols-2">
        {secondary.map((plan) => (
          <SecondaryPlanCard key={plan.key} plan={plan} isSignedIn={isSignedIn} />
        ))}
      </div>

      {/* Features checklist */}
      <Reveal>
        <section
          aria-labelledby="premium-features"
          className={cn(cardClass(), 'mx-auto mt-10 max-w-2xl p-6 sm:p-8')}
        >
          <h2 id="premium-features" className="font-display text-xl font-semibold text-stone-50">
            Everything in Premium
          </h2>
          <ul className="mt-5 grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-stone-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Icon name="check" size={13} weight="bold" />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <p className="mx-auto mt-8 max-w-md text-center text-xs leading-relaxed text-stone-500">
        Payments are processed securely by Stripe. Cancel anytime in the customer portal.{' '}
        <Link href="/legal/terms" className="underline underline-offset-2 hover:text-stone-300">
          Terms
        </Link>
      </p>
    </div>
  );
}
