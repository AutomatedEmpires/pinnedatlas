'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icon';

const BASE_BUTTON =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

const LOCATION_ACTIONS = [
  {
    action: 'approve',
    label: 'Approve',
    className: `${BASE_BUTTON} bg-accent text-stone-950 hover:bg-accent-strong focus-visible:outline-accent`,
  },
  {
    action: 'verify',
    label: 'Verify',
    className: `${BASE_BUTTON} border border-accent text-accent hover:bg-accent/10 focus-visible:outline-accent`,
  },
  {
    action: 'reject',
    label: 'Reject',
    className: `${BASE_BUTTON} border border-red-500/50 text-red-400 hover:bg-red-500/10 focus-visible:outline-red-400`,
  },
] as const;

export function ModerateControls({ kind, id }: { kind: 'location' | 'report'; id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // One-tap confirm for destructive report delete: first tap arms, second fires.
  const [armed, setArmed] = useState(false);

  async function send(action: string) {
    setPending(action);
    setError(null);
    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, id, action }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      setArmed(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-3">
      {kind === 'location' ? (
        <div className="flex flex-wrap gap-2">
          {LOCATION_ACTIONS.map(({ action, label, className }) => (
            <button
              key={action}
              type="button"
              className={className}
              disabled={pending !== null}
              onClick={() => void send(action)}
            >
              {pending === action ? (
                <Icon name="spinner" size={16} className="animate-spin" />
              ) : null}
              {label}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          disabled={pending !== null}
          aria-label={armed ? 'Confirm delete report' : 'Delete report'}
          className={`${BASE_BUTTON} focus-visible:outline-red-400 ${
            armed
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'border border-red-500/50 text-red-400 hover:bg-red-500/10'
          }`}
          onClick={() => {
            if (!armed) {
              setArmed(true);
              return;
            }
            void send('delete');
          }}
        >
          {pending === 'delete' ? <Icon name="spinner" size={16} className="animate-spin" /> : null}
          {armed ? 'Confirm delete?' : 'Delete'}
        </button>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
