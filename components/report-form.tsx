'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Icon } from '@/components/icon';
import { REPORT_TYPES, REPORT_TYPE_LABELS, type ReportType } from '@/lib/types';

// Mirrors the server schema in app/api/locations/[id]/reports/route.ts.
const bodySchema = z
  .string()
  .trim()
  .min(3, 'Report must be at least 3 characters')
  .max(1000, 'Report must be 1000 characters or fewer');

export function ReportForm({
  locationId,
  isSignedIn,
}: {
  locationId: string;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const formId = useId();
  const [reportType, setReportType] = useState<ReportType>('condition_update');
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  if (!isSignedIn) {
    return (
      <p className="rounded-lg border border-stone-800 bg-surface-raised px-4 py-3 text-sm text-stone-400">
        <Link
          href="/sign-in"
          className="font-medium text-accent underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Sign in
        </Link>{' '}
        to report current conditions.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid report');
      setPosted(false);
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_type: reportType, body: parsed.data }),
      });
      if (res.status === 401) {
        router.push('/sign-in');
        return;
      }
      if (!res.ok) {
        setError('Could not post your report. Please try again.');
        return;
      }
      setBody('');
      setReportType('condition_update');
      setPosted(true);
      router.refresh();
    } catch {
      setError('Network error — check your connection and try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div>
        <label
          htmlFor={`${formId}-type`}
          className="mb-1.5 block text-sm font-medium text-stone-300"
        >
          Report type
        </label>
        <select
          id={`${formId}-type`}
          value={reportType}
          onChange={(e) => setReportType(e.target.value as ReportType)}
          className="w-full min-h-11 rounded-lg border border-stone-700 bg-surface-raised px-3 py-2.5 text-base text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t}>
              {REPORT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`${formId}-body`}
          className="mb-1.5 block text-sm font-medium text-stone-300"
        >
          What did you find?
        </label>
        <textarea
          id={`${formId}-body`}
          rows={3}
          required
          maxLength={1000}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setPosted(false);
          }}
          placeholder="e.g. Flowing strong after rain; trail muddy but passable"
          className="w-full rounded-lg border border-stone-700 bg-surface-raised px-3 py-2.5 text-base text-stone-100 placeholder:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${formId}-error` : undefined}
        />
        {error ? (
          <p id={`${formId}-error`} role="alert" className="mt-1.5 text-sm text-red-400">
            {error}
          </p>
        ) : null}
      </div>

      {posted ? (
        <p role="status" className="flex items-center gap-2 text-sm text-accent">
          <Icon name="check" size={16} weight="bold" />
          Thanks — report posted.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-accent px-4 font-medium text-stone-950 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60"
      >
        {pending ? (
          <Icon name="spinner" size={18} className="animate-spin" />
        ) : (
          <Icon name="report" size={18} />
        )}
        {pending ? 'Posting…' : 'Post report'}
      </button>
    </form>
  );
}
