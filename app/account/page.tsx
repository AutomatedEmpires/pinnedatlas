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
    <nav aria-label="About and legal" className="mt-10 border-t border-stone-800 pt-6">
      <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-400">
        <li>
          <Link href="/about" className="hover:text-stone-200">
            About
          </Link>
        </li>
        <li>
          <Link href="/legal/terms" className="hover:text-stone-200">
            Terms
          </Link>
        </li>
        <li>
          <Link href="/legal/privacy" className="hover:text-stone-200">
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
      <div className="mx-auto w-full max-w-shell px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-50">Account</h1>
        <div className="mt-6 rounded-2xl border border-stone-800 bg-surface-raised p-6">
          <Icon name="user" size={28} className="text-stone-400" />
          <h2 className="mt-3 font-semibold text-stone-100">Sign-in is on the way</h2>
          <p className="mt-2 text-sm text-stone-400">
            Accounts are still being configured for PinnedAtlas. Check back soon to save
            spots, log visits, and go Premium.
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-stone-700 px-4 font-medium text-stone-200 hover:border-stone-500"
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
      <div className="mx-auto w-full max-w-shell px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-50">Account</h1>
        <div className="mt-6 rounded-2xl border border-stone-800 bg-surface-raised p-6">
          <Icon name="user" size={28} className="text-stone-400" />
          <h2 className="mt-3 font-semibold text-stone-100">Sign in to PinnedAtlas</h2>
          <p className="mt-2 text-sm text-stone-400">
            Save spots, track the places you have visited, and manage your Premium
            membership.
          </p>
          <Link
            href="/sign-in"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-semibold text-stone-950 hover:brightness-110"
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

  return (
    <div className="mx-auto w-full max-w-shell px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-50">Account</h1>

      {checkout === 'success' ? (
        <div
          role="status"
          className="mt-4 flex items-start gap-3 rounded-xl border border-accent/40 bg-surface-raised p-4"
        >
          <Icon name="approve" size={22} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-sm text-stone-200">
            Welcome to Premium — entitlement activates within a minute of payment.
          </p>
        </div>
      ) : null}

      <section
        aria-label="Profile"
        className="mt-6 rounded-2xl border border-stone-800 bg-surface-raised p-5"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-overlay">
            <Icon name="user" size={22} className="text-stone-300" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-stone-100">
              {email ?? 'Signed in'}
            </p>
            <p className="text-xs text-stone-500">Signed in with Clerk</p>
          </div>
        </div>
      </section>

      <section
        aria-label="Membership"
        className="mt-4 rounded-2xl border border-stone-800 bg-surface-raised p-5"
      >
        <div className="flex items-center gap-2">
          {entitlement.isPremium ? (
            <Icon name="premium" size={20} className="text-accent" />
          ) : null}
          <h2 className="font-semibold text-stone-100">
            {PLAN_LABELS[entitlement.plan] ?? entitlement.plan}
          </h2>
        </div>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-stone-400">Status</dt>
            <dd className="text-stone-200">
              {entitlement.plan === 'lifetime'
                ? 'Lifetime access'
                : sub?.status && sub.status !== 'none'
                  ? sub.status
                  : 'Free tier'}
            </dd>
          </div>
          {renewsOn && entitlement.isPremium && entitlement.plan !== 'lifetime' ? (
            <div className="flex justify-between gap-4">
              <dt className="text-stone-400">Current period ends</dt>
              <dd className="text-stone-200">{renewsOn}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-4">
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
              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-4 font-semibold text-stone-950 hover:brightness-110"
            >
              Upgrade
            </Link>
          )}
        </div>
      </section>

      {admin ? (
        <section
          aria-label="Admin"
          className="mt-4 rounded-2xl border border-stone-800 bg-surface-raised p-5"
        >
          <h2 className="font-semibold text-stone-100">Admin</h2>
          <Link
            href="/admin/moderation"
            className="mt-2 inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-2"
          >
            Moderation queue
          </Link>
        </section>
      ) : null}

      <div className="mt-6">
        <SignOutButton>
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-center rounded-lg border border-stone-700 px-4 font-medium text-stone-300 hover:border-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Sign out
          </button>
        </SignOutButton>
      </div>

      <FooterLinks />
    </div>
  );
}
