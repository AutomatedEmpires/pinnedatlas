'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';

export function SaveButton({
  locationId,
  initialSaved,
  isSignedIn,
}: {
  locationId: string;
  initialSaved: boolean;
  isSignedIn: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const [limitHit, setLimitHit] = useState(false);

  async function toggle() {
    if (!isSignedIn) {
      window.location.href = '/sign-in';
      return;
    }
    if (pending) return;

    const next = !saved;
    // Optimistic: flip immediately, revert on failure.
    setSaved(next);
    setLimitHit(false);
    setPending(true);
    try {
      const res = await fetch('/api/user-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: locationId, saved: next }),
      });
      if (!res.ok) {
        setSaved(!next);
        if (res.status === 402) setLimitHit(true);
      }
    } catch {
      setSaved(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          saved
            ? 'border-accent/40 bg-accent/10 text-accent'
            : 'border-stone-700 bg-surface-raised text-stone-200 hover:bg-surface-overlay'
        }`}
      >
        <Icon name="save" size={20} weight={saved ? 'fill' : 'regular'} />
        {saved ? 'Saved' : 'Save'}
      </button>
      {limitHit && (
        <p className="mt-2 text-sm text-amber-300">
          Free plan is full —{' '}
          <a href="/pricing" className="underline">
            go Premium
          </a>{' '}
          for unlimited saves.
        </p>
      )}
    </div>
  );
}
