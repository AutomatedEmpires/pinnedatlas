import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { LocationCard } from '@/components/location-card';
import { listLocations } from '@/lib/db/locations';
import { hasSupabase } from '@/lib/env';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_TIERS,
  FEATURE_TYPES,
  FEATURE_TYPE_LABELS,
  type DifficultyTier,
  type FeatureType,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Browse spots',
  description:
    'Search and filter every cave, waterfall, hot spring, and spring in the atlas.',
};

type SearchParams = { [key: string]: string | string[] | undefined };

/** Accepts repeated params and comma-separated values (`types=cave,waterfall`). */
function toList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value])
    .flatMap((v) => v.split(','))
    .map((s) => s.trim())
    .filter(Boolean);
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

export default async function SpotsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const q = first(sp.q);
  const state = first(sp.state).toUpperCase();
  const verifiedOnly = ['1', 'true'].includes(first(sp.verified));
  const types = toList(sp.types).filter((t): t is FeatureType =>
    (FEATURE_TYPES as string[]).includes(t),
  );
  const difficulties = toList(sp.difficulty).filter((d): d is DifficultyTier =>
    (DIFFICULTY_TIERS as string[]).includes(d),
  );

  const locations = await listLocations({
    q: q || undefined,
    types: types.length ? types : undefined,
    difficulties: difficulties.length ? difficulties : undefined,
    verifiedOnly: verifiedOnly || undefined,
    state: state || undefined,
    limit: 200,
  });

  const activeFilters: string[] = [
    ...types.map((t) => FEATURE_TYPE_LABELS[t]),
    ...difficulties.map((d) => DIFFICULTY_LABELS[d]),
    ...(verifiedOnly ? ['Verified only'] : []),
    ...(state ? [state] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-shell px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-100">Browse spots</h1>

        <form method="GET" action="/spots" role="search" className="mt-4 flex gap-2">
          <label htmlFor="spots-search" className="sr-only">
            Search spots by name
          </label>
          <input
            id="spots-search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name…"
            className="min-h-11 w-full rounded-lg border border-stone-700 bg-surface-raised px-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-accent focus:outline-none"
          />
          {/* Preserve active filters when re-searching. */}
          {types.length > 0 && <input type="hidden" name="types" value={types.join(',')} />}
          {difficulties.length > 0 && (
            <input type="hidden" name="difficulty" value={difficulties.join(',')} />
          )}
          {verifiedOnly && <input type="hidden" name="verified" value="1" />}
          {state && <input type="hidden" name="state" value={state} />}
          <button
            type="submit"
            aria-label="Search"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-accent text-stone-950 transition-colors hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="search" size={20} />
          </button>
        </form>

        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-stone-500">Filters:</span>
            {activeFilters.map((filter) => (
              <span key={filter} className="rounded-full bg-surface-overlay px-2.5 py-1 text-stone-300">
                {filter}
              </span>
            ))}
            <Link
              href="/spots"
              className="ml-1 py-1 text-accent underline-offset-2 hover:underline"
            >
              Clear
            </Link>
          </div>
        )}
      </header>

      {!hasSupabase ? (
        <div className="mt-8 rounded-xl bg-surface-raised p-6 text-center">
          <p className="text-sm text-stone-300">The atlas is being stocked — check back shortly.</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="mt-8 rounded-xl bg-surface-raised p-6 text-center">
          <p className="text-sm text-stone-300">No spots match your search.</p>
          <Link
            href="/spots"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-700 px-4 text-sm font-medium text-accent transition-colors hover:bg-surface-overlay"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-stone-400">
            {locations.length === 1 ? '1 spot' : `${locations.length} spots`}
          </p>
          <ul className="mt-3 space-y-2">
            {locations.map((location) => (
              <li key={location.id}>
                <LocationCard location={location} />
              </li>
            ))}
          </ul>
        </>
      )}

      <footer className="mt-10 border-t border-stone-800 pt-4">
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500"
        >
          <Link href="/about" className="py-1 hover:text-stone-300">
            About
          </Link>
          <Link href="/legal/terms" className="py-1 hover:text-stone-300">
            Terms
          </Link>
          <Link href="/legal/privacy" className="py-1 hover:text-stone-300">
            Privacy
          </Link>
          <Link href="/pricing" className="py-1 hover:text-stone-300">
            Pricing
          </Link>
        </nav>
      </footer>
    </div>
  );
}
