'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';

export function ManageBillingButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      if (res.status === 503) {
        setError('The billing portal is not available yet.');
        return;
      }
      const data = (await res.json().catch(() => null)) as { url?: string } | null;
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setError('Could not open the billing portal. Please try again.');
    } catch {
      setError('Could not open the billing portal. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={openPortal}
        disabled={pending}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-stone-700 bg-surface-raised px-4 py-2.5 font-medium text-stone-200 transition hover:border-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Icon name="spinner" size={18} className="animate-spin" />
            <span>Opening portal…</span>
          </>
        ) : (
          <span>Manage billing</span>
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
