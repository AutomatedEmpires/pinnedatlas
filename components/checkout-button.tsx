'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import type { PlanKey } from '@/lib/billing/plans';

export function CheckoutButton({
  plan,
  isSignedIn,
}: {
  plan: PlanKey;
  isSignedIn: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (!isSignedIn) {
      window.location.href = '/sign-in';
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 503) {
        setUnavailable(true);
        return;
      }
      const data = (await res.json().catch(() => null)) as { url?: string } | null;
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setError('Could not start checkout. Please try again.');
    } catch {
      setError('Could not start checkout. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={pending || unavailable}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-stone-950 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Icon name="spinner" size={18} className="animate-spin" />
            <span>Redirecting…</span>
          </>
        ) : unavailable ? (
          <span>Payments launching soon</span>
        ) : (
          <span>{isSignedIn ? 'Get Premium' : 'Sign in to upgrade'}</span>
        )}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
