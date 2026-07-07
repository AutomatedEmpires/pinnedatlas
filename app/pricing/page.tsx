import type { Metadata } from 'next';
import Link from 'next/link';
import { getUserId } from '@/lib/auth';
import { getEntitlement } from '@/lib/billing/entitlements';
import { PLANS, PREMIUM_FEATURES, type Plan } from '@/lib/billing/plans';
import { CheckoutButton } from '@/components/checkout-button';
import { Icon } from '@/components/icon';

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
      className="flex flex-col rounded-2xl border border-stone-800 bg-surface-raised p-5"
    >
      <h3 className="text-sm font-semibold text-stone-200">{plan.name}</h3>
      <p className="mt-2">
        <span className="text-2xl font-bold text-stone-50">{plan.priceLabel}</span>{' '}
        <span className="text-sm text-stone-400">{plan.cadenceLabel}</span>
      </p>
      <p className="mt-2 flex-1 text-sm text-stone-400">{plan.blurb}</p>
      <div className="mt-4">
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
    <div className="mx-auto w-full max-w-shell px-4 py-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-stone-50">Go Premium</h1>
        <p className="mt-2 text-sm text-stone-400">
          Save unlimited spots, log your visits, and unlock advanced filters.
        </p>
      </header>

      {entitlement.isPremium ? (
        <div
          role="status"
          className="mt-6 flex items-center gap-3 rounded-xl border border-accent/40 bg-surface-raised p-4"
        >
          <Icon name="premium" size={24} className="shrink-0 text-accent" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-stone-100">
              You are Premium ({PLAN_LABELS[entitlement.plan] ?? entitlement.plan})
            </p>
            <Link href="/account" className="text-accent underline underline-offset-2">
              Manage your account
            </Link>
          </div>
        </div>
      ) : null}

      <section
        aria-label={monthly.name}
        className="relative mt-8 rounded-2xl bg-surface-raised p-6 ring-2 ring-accent"
      >
        <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-stone-950">
          Most popular
        </span>
        <h2 className="text-base font-semibold text-stone-200">{monthly.name}</h2>
        <p className="mt-3">
          <span className="text-4xl font-bold text-stone-50">{monthly.priceLabel}</span>{' '}
          <span className="text-sm text-stone-400">{monthly.cadenceLabel}</span>
        </p>
        <p className="mt-3 text-sm text-stone-300">{monthly.blurb}</p>
        <div className="mt-5">
          <CheckoutButton plan={monthly.key} isSignedIn={isSignedIn} />
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {secondary.map((plan) => (
          <SecondaryPlanCard key={plan.key} plan={plan} isSignedIn={isSignedIn} />
        ))}
      </div>

      <section aria-labelledby="premium-features" className="mt-10">
        <h2 id="premium-features" className="text-base font-semibold text-stone-100">
          Everything in Premium
        </h2>
        <ul className="mt-4 space-y-3">
          {PREMIUM_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-stone-300">
              <Icon name="check" size={18} weight="bold" className="mt-0.5 shrink-0 text-accent" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-center text-xs text-stone-500">
        Payments are processed securely by Stripe. Cancel anytime in the customer portal.{' '}
        <Link
          href="/legal/terms"
          className="underline underline-offset-2 hover:text-stone-300"
        >
          Terms
        </Link>
      </p>
    </div>
  );
}
