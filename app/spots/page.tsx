import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { LocationCard } from '@/components/location-card';
import { SpotsFilters } from '@/components/spots-filters';
import { listLocations, locationsNear } from '@/lib/db/locations';
import { hasSupabase } from '@/lib/env';
import {
  DIFFICULTY_TIERS,
  FEATURE_TYPES,
  type DifficultyTier,
  type FeatureType,
  type LocationRecord,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Browse spots',
  description:
    'Search, filter, and sort every cave, waterfall, hot spring, and spring in the atlas.',
};

// How far around the user we look, and how many rows we pull, when sorting by distance.
const NEAR_RADIUS_M = 800_000;
const NEAR_FETCH = 300;
const RESULT_LIMIT = 240;

type SearchParams = { [key: string]: string | string[] | undefined };
type CardItem = { location: LocationRecord; distanceKm?: number };

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

/** Parse a `lat,lng` string into validated coordinates, or null if malformed. */
function parseNear(value: string): { lat: number; lng: number } | null {
  const parts = value.split(',');
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
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
  const nearCoords = sp.near ? parseNear(first(sp.near)) : null;

  let items: CardItem[] = [];
  let isNear = false;

  if (hasSupabase) {
    if (nearCoords) {
      isNear = true;
      const rows = await locationsNear(nearCoords.lat, nearCoords.lng, NEAR_RADIUS_M, NEAR_FETCH);
      const needle = q.toLowerCase();
      const filtered = rows.filter((row) => {
        if (types.length && !types.includes(row.feature_type)) return false;
        if (difficulties.length && !difficulties.includes(row.difficulty_tier)) return false;
        if (verifiedOnly && row.moderation_status !== 'verified') return false;
        if (state && (row.state_code ?? '').toUpperCase() !== state) return false;
        if (needle && !row.name.toLowerCase().includes(needle)) return false;
        return true;
      });
      // Rows arrive already sorted by distance; keep that order.
      items = filtered.slice(0, RESULT_LIMIT).map((row) => ({
        location: row,
        distanceKm: row.distance_m / 1000,
      }));
    } else {
      const rows = await listLocations({
        q: q || undefined,
        types: types.length ? types : undefined,
        difficulties: difficulties.length ? difficulties : undefined,
        verifiedOnly: verifiedOnly || undefined,
        state: state || undefined,
        limit: RESULT_LIMIT,
      });
      items = rows.map((location) => ({ location }));
    }
  }

  const count = items.length;
  const countLabel = isNear
    ? `${count} ${count === 1 ? 'spot' : 'spots'} near you`
    : `${count} ${count === 1 ? 'spot' : 'spots'}`;

  return (
    <div className="mx-auto w-full max-w-shell px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-100">Browse spots</h1>

        {hasSupabase && (
          <>
            <p className="mt-1 text-sm text-stone-400">{countLabel}</p>

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
              {/* Preserve active non-q filters so searching does not drop them. */}
              {types.length > 0 && <input type="hidden" name="types" value={types.join(',')} />}
              {difficulties.length > 0 && (
                <input type="hidden" name="difficulty" value={difficulties.join(',')} />
              )}
              {verifiedOnly && <input type="hidden" name="verified" value="1" />}
              {state && <input type="hidden" name="state" value={state} />}
              {nearCoords && (
                <input type="hidden" name="near" value={first(sp.near)} />
              )}
              {isNear && <input type="hidden" name="sort" value="nearest" />}
              <button
                type="submit"
                aria-label="Search"
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-stone-950 transition-colors hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Icon name="search" size={20} />
              </button>
            </form>
          </>
        )}
      </header>

      {!hasSupabase ? (
        <div className="mt-8 rounded-xl border border-stone-800 bg-surface-raised p-6 text-center">
          <p className="text-sm text-stone-300">
            The atlas is being stocked — check back shortly.
          </p>
        </div>
      ) : (
        <>
          <SpotsFilters />

          {count === 0 ? (
            <div className="mt-8 rounded-xl border border-stone-800 bg-surface-raised p-6 text-center">
              <div className="flex justify-center text-stone-500">
                <Icon name="search" size={28} />
              </div>
              <p className="mt-3 text-sm text-stone-300">No spots match your filters.</p>
              <Link
                href="/spots"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-700 px-5 text-sm font-medium text-accent transition-colors hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {items.map(({ location, distanceKm }) => (
                <li key={location.id}>
                  <LocationCard location={location} distanceKm={distanceKm} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <footer className="mt-10 border-t border-stone-800 pt-4">
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500"
        >
          <Link href="/" className="py-1 hover:text-stone-300">
            Home
          </Link>
          <Link href="/about" className="py-1 hover:text-stone-300">
            About
          </Link>
          <Link href="/pricing" className="py-1 hover:text-stone-300">
            Pricing
          </Link>
          <Link href="/legal/terms" className="py-1 hover:text-stone-300">
            Terms
          </Link>
          <Link href="/legal/privacy" className="py-1 hover:text-stone-300">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
