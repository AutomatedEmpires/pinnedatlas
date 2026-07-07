'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icon';

interface SpotControlsProps {
  locationId: string;
  saved: boolean;
  visited: boolean;
  personalNote: string | null;
  isPremium: boolean;
}

type PendingAction = 'unsave' | 'visited' | 'note';

const ERROR_MESSAGES: Record<string, string> = {
  save_limit: 'Save limit reached — go Premium for unlimited saves.',
  premium_required: 'That feature requires Premium.',
  unauthorized: 'Sign in to continue.',
};

const FALLBACK_ERROR = 'Something went wrong. Try again.';

const buttonClass =
  'inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-stone-700 px-3 text-sm text-stone-300 hover:border-stone-500 hover:text-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';

export function SpotControls({
  locationId,
  saved,
  visited,
  personalNote,
  isPremium,
}: SpotControlsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVisited, setIsVisited] = useState(visited);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(personalNote ?? '');
  const [noteSaved, setNoteSaved] = useState(false);

  async function post(fields: Record<string, unknown>): Promise<void> {
    const res = await fetch('/api/user-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location_id: locationId, ...fields }),
    });
    if (!res.ok) {
      let code: string | undefined;
      try {
        code = ((await res.json()) as { error?: string }).error;
      } catch {
        // non-JSON error body; fall through to generic message
      }
      throw new Error((code && ERROR_MESSAGES[code]) || FALLBACK_ERROR);
    }
  }

  async function handleUnsave() {
    setPending('unsave');
    setError(null);
    try {
      await post({ saved: false });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : FALLBACK_ERROR);
    } finally {
      setPending(null);
    }
  }

  async function handleVisitedToggle() {
    const next = !isVisited;
    setPending('visited');
    setError(null);
    setIsVisited(next);
    try {
      await post({ visited: next });
      router.refresh();
    } catch (err) {
      setIsVisited(!next);
      setError(err instanceof Error ? err.message : FALLBACK_ERROR);
    } finally {
      setPending(null);
    }
  }

  async function handleSaveNote() {
    setPending('note');
    setError(null);
    setNoteSaved(false);
    try {
      await post({ personal_note: note.trim() === '' ? null : note });
      setNoteSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : FALLBACK_ERROR);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-2 text-sm text-stone-300">
      <div className="flex flex-wrap items-center gap-2">
        {saved && (
          <button
            type="button"
            onClick={handleUnsave}
            disabled={pending !== null}
            className={buttonClass}
          >
            <Icon
              name={pending === 'unsave' ? 'spinner' : 'save'}
              size={16}
              className={pending === 'unsave' ? 'animate-spin' : undefined}
            />
            Unsave
          </button>
        )}
        {isPremium ? (
          <button
            type="button"
            onClick={handleVisitedToggle}
            disabled={pending !== null}
            aria-pressed={isVisited}
            className={`${buttonClass} ${isVisited ? 'border-accent/50 text-accent' : ''}`}
          >
            <Icon
              name={pending === 'visited' ? 'spinner' : 'visited'}
              size={16}
              weight={isVisited ? 'fill' : 'regular'}
              className={pending === 'visited' ? 'animate-spin' : undefined}
            />
            {isVisited ? 'Visited' : 'Mark visited'}
          </button>
        ) : (
          <Link
            href="/pricing"
            className={buttonClass}
            aria-label="Mark visited — Premium feature, see pricing"
          >
            <Icon name="visited" size={16} />
            Visited
            <Icon name="premium" size={14} className="text-accent" />
          </Link>
        )}
        {isPremium && (
          <button
            type="button"
            onClick={() => setNoteOpen((open) => !open)}
            aria-expanded={noteOpen}
            className={buttonClass}
          >
            <Icon name="report" size={16} />
            Note
          </button>
        )}
      </div>

      {isPremium && noteOpen && (
        <div className="mt-2">
          <label htmlFor={`note-${locationId}`} className="sr-only">
            Personal note
          </label>
          <textarea
            id={`note-${locationId}`}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setNoteSaved(false);
            }}
            maxLength={2000}
            rows={3}
            placeholder="Private note — only you can see this"
            className="w-full rounded-lg border border-stone-700 bg-surface-raised p-3 text-sm text-stone-100 placeholder:text-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={pending !== null}
              className={buttonClass}
            >
              {pending === 'note' && (
                <Icon name="spinner" size={16} className="animate-spin" />
              )}
              Save note
            </button>
            {noteSaved && (
              <span className="inline-flex items-center gap-1 text-xs text-accent">
                <Icon name="check" size={14} />
                Note saved
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
