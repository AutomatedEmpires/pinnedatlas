import type { Metadata } from 'next';
import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { getUserId, isAdmin } from '@/lib/auth';
import { getEntitlement } from '@/lib/billing/entitlements';
import { getSubscription } from '@/lib/db/subscriptions';
import { hasClerk } from '@/lib/env';
import { Icon } from '@/components/icon';
import { ManageBillingButton } from '@/components/manage-billing-button';
import { StatTile, badgeClass, buttonClass, cardClass, cn } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Account',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  monthly: 'Premium — Monthly',
  annual: 'Premium — Annual',
  lifetime: 'Premium — Lifetime',
};

function FooterLinks() {
  return (
    <nav aria-label="About and legal" className="mt-10 border-t border-white/8 pt-6">
      <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-400">
        <li>
          <Link href="/about" className="underline-offset-2 hover:text-stone-200 hover:underline">
            About
          </Link>
        </li>
        <li>
          <Link href="/legal/terms" className="underline-offset-2 hover:text-stone-200 hover:underline">
            Terms
          </Link>
        </li>
        <li>
          <Link
            href="/legal/privacy"
            className="underline-offset-2 hover:text-stone-200 hover:underline"
          >
            Privacy
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;

  if (!hasClerk) {
    return (
      <div className="mx-auto w-full max-w-content px-4 py-10 sm:px-6 lg:py-14">
        <h1 className="font-display text-3xl font-semibold text-stone-50 sm:text-4xl">Account</h1>
        <div className={cn(cardClass(), 'mt-6 max-w-lg p-6')}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-stone-400">
            <Icon name="user" size={26} />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-stone-100">Sign-in is on the way</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            Accounts are still being configured for PinnedAtlas. Check back soon to save spots, log
            visits, and go Premium.
          </p>
          <Link
            href="/pricing"
            className={cn(buttonClass({ variant: 'secondary', size: 'md' }), 'mt-5')}
          >
            See Premium plans
          </Link>
        </div>
        <FooterLinks />
      </div>
    );
  }

  const userId = await getUserId();

  if (!userId) {
    return (
      <div className="mx-auto w-full max-w-content px-4 py-10 sm:px-6 lg:py-14">
        <h1 className="font-display text-3xl font-semibold text-stone-50 sm:text-4xl">Account</h1>
        <div className={cn(cardClass(), 'mt-6 max-w-lg p-6')}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-stone-400">
            <Icon name="user" size={26} />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-stone-100">Sign in to PinnedAtlas</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            Save spots, track the places you have visited, and manage your Premium membership.
          </p>
          <Link
            href="/sign-in"
            className={cn(buttonClass({ variant: 'primary', size: 'md' }), 'mt-5')}
          >
            Sign in
          </Link>
        </div>
        <FooterLinks />
      </div>
    );
  }

  const [user, entitlement, sub, admin] = await Promise.all([
    currentUser(),
    getEntitlement(userId),
    getSubscription(userId),
    isAdmin(),
  ]);

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  const renewsOn = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const statusLabel =
    entitlement.plan === 'lifetime'
      ? 'Lifetime access'
      : sub?.status && sub.status !== 'none'
        ? sub.status
        : 'Free tier';

  return (
    <div className="mx-auto w-full max-w-content px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="font-display text-3xl font-semibold text-stone-50 sm:text-4xl">Account</h1>

      {checkout === 'success' ? (
        <div
          role="status"
          className="mt-6 flex max-w-2xl items-start gap-3 rounded-2xl border border-accent/40 bg-accent/[0.06] p-4"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Icon name="approve" size={20} weight="fill" />
          </span>
          <p className="text-sm text-stone-200">
            <span className="font-semibold text-stone-100">Welcome to Premium.</span> Your
            entitlement activates within a minute of payment.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid max-w-3xl gap-4">
        {/* Profile */}
        <section aria-label="Profile" className={cn(cardClass(), 'p-5 sm:p-6')}>
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 text-stone-300 ring-1 ring-inset ring-white/10">
              <Icon name="user" size={24} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-stone-100">{email ?? 'Signed in'}</p>
              <p className="text-xs text-stone-500">Signed in with Clerk</p>
            </div>
          </div>
        </section>

        {/* Membership */}
        <section aria-label="Membership" className={cn(cardClass(), 'p-5 sm:p-6')}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {entitlement.isPremium ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent ring-1 ring-inset ring-accent/25">
                  <Icon name="premium" size={18} weight="fill" />
                </span>
              ) : null}
              <h2 className="text-lg font-semibold text-stone-50">
                {PLAN_LABELS[entitlement.plan] ?? entitlement.plan}
              </h2>
            </div>
            {entitlement.isPremium ? (
              <span className={badgeClass('accent')}>Active</span>
            ) : (
              <span className={badgeClass('neutral')}>Free</span>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatTile label="Status" value={<span className="capitalize">{statusLabel}</span>} />
            {renewsOn && entitlement.isPremium && entitlement.plan !== 'lifetime' ? (
              <StatTile label="Current period ends" value={renewsOn} />
            ) : null}
          </div>

          <div className="mt-5">
            {entitlement.isPremium ? (
              entitlement.plan !== 'lifetime' ? (
                <ManageBillingButton />
              ) : (
                <p className="text-sm text-stone-400">
                  One payment, Premium forever — nothing to manage.
                </p>
              )
            ) : (
              <Link
                href="/pricing"
                className={cn(buttonClass({ variant: 'primary', size: 'lg' }), 'w-full')}
              >
                <Icon name="premium" size={18} weight="fill" />
                Upgrade to Premium
              </Link>
            )}
          </div>
        </section>

        {/* Admin */}
        {admin ? (
          <section aria-label="Admin" className={cn(cardClass(), 'p-5 sm:p-6')}>
            <h2 className="text-base font-semibold text-stone-100">Admin</h2>
            <Link
              href="/admin/moderation"
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm text-accent underline underline-offset-2 hover:text-accent-strong"
            >
              <Icon name="verified" size={16} />
              Moderation queue
            </Link>
          </section>
        ) : null}

        {/* Sign out */}
        <div>
          <SignOutButton>
            <button
              type="button"
              className={cn(buttonClass({ variant: 'secondary', size: 'md' }), 'w-full')}
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>

      <FooterLinks />
    </div>
  );
}
