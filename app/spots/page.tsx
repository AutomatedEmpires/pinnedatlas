import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { LocationCard } from '@/components/location-card';
import { SpotsFilters } from '@/components/spots-filters';
import { Reveal } from '@/components/reveal';
import { badgeClass, buttonClass, cardClass } from '@/components/ui';
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
  const atLimit = count >= RESULT_LIMIT;
  const countLabel = isNear
    ? `${count}${atLimit ? '+' : ''} ${count === 1 ? 'spot' : 'spots'} near you`
    : `${count}${atLimit ? '+' : ''} ${count === 1 ? 'spot' : 'spots'}`;

  return (
    <div className="mx-auto w-full max-w-wide px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Field guide
        </span>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-50 sm:text-4xl lg:text-5xl">
          Browse spots
        </h1>

        {hasSupabase && (
          <>
            <p className="mt-3 text-base text-stone-400">
              Every cave, waterfall, hot spring, and spring in the atlas — search, filter, and sort
              your way to the next one.
            </p>
            <p className="mt-3 text-sm font-medium tabular-nums text-stone-500">
              {isNear && (
                <Icon
                  name="pin"
                  size={13}
                  weight="fill"
                  className="mr-1 inline-block align-[-1px] text-accent"
                />
              )}
              {countLabel}
            </p>

            <form
              method="GET"
              action="/spots"
              role="search"
              className="relative mt-6 w-full"
            >
              <label htmlFor="spots-search" className="sr-only">
                Search spots by name
              </label>
              <Icon
                name="search"
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-500"
              />
              <input
                id="spots-search"
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search by name…"
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-surface-raised pl-11 pr-28 text-sm text-stone-100 shadow-card transition-colors placeholder:text-stone-500 hover:border-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {/* Preserve active non-q filters so searching does not drop them. */}
              {types.length > 0 && <input type="hidden" name="types" value={types.join(',')} />}
              {difficulties.length > 0 && (
                <input type="hidden" name="difficulty" value={difficulties.join(',')} />
              )}
              {verifiedOnly && <input type="hidden" name="verified" value="1" />}
              {state && <input type="hidden" name="state" value={state} />}
              {nearCoords && <input type="hidden" name="near" value={first(sp.near)} />}
              {isNear && <input type="hidden" name="sort" value="nearest" />}
              <button
                type="submit"
                className={buttonClass({
                  variant: 'primary',
                  size: 'sm',
                  className: 'absolute right-1.5 top-1/2 -translate-y-1/2',
                })}
              >
                Search
              </button>
            </form>
          </>
        )}
      </header>

      <Reveal>
        <Link
          href="/explore"
          className="group relative mt-6 flex items-center gap-4 overflow-hidden rounded-2xl border border-topaz/20 bg-gradient-to-br from-topaz/[0.12] via-surface-raised to-surface-raised p-4 shadow-card transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:border-topaz/40 hover:shadow-float focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-topaz sm:p-5"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-topaz/15 text-topaz ring-1 ring-inset ring-topaz/25 transition-transform duration-200 ease-spring group-hover:scale-105">
            <Icon name="compass" size={24} weight="fill" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-display text-lg font-semibold text-stone-50">
                Explore by type &amp; region
              </span>
              <span className={badgeClass('topaz')}>Curated</span>
            </span>
            <span className="mt-0.5 block text-sm text-stone-400">
              Browse collections across caves, waterfalls, hot springs, and every state.
            </span>
          </span>
          <Icon
            name="directions"
            size={18}
            className="hidden shrink-0 -rotate-90 text-topaz transition-transform duration-200 ease-spring group-hover:-translate-y-0.5 sm:block"
          />
        </Link>
      </Reveal>

      {!hasSupabase ? (
        <div className={cardClass({ className: 'mt-8 p-8 text-center sm:p-12' })}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-stone-400 ring-1 ring-inset ring-white/10">
            <Icon name="compass" size={26} />
          </div>
          <p className="mt-4 font-display text-lg font-semibold text-stone-100">
            The atlas is being stocked
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-stone-400">
            We&rsquo;re loading spots into this region — check back shortly.
          </p>
        </div>
      ) : (
        <>
          <SpotsFilters />

          {count === 0 ? (
            <div className={cardClass({ className: 'mt-8 p-8 text-center sm:p-12' })}>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-stone-400 ring-1 ring-inset ring-white/10">
                <Icon name="search" size={26} />
              </div>
              <p className="mt-4 font-display text-lg font-semibold text-stone-100">
                No spots match your filters
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-stone-400">
                Try widening your search — remove a filter, zoom out from &ldquo;near me,&rdquo; or
                clear everything to start fresh.
              </p>
              <Link
                href="/spots"
                className={buttonClass({
                  variant: 'secondary',
                  size: 'md',
                  className: 'mt-6',
                })}
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(({ location, distanceKm }) => (
                <li key={location.id}>
                  <LocationCard location={location} distanceKm={distanceKm} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <footer className="mt-12 border-t border-white/8 pt-6">
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-500"
        >
          <Link href="/" className="py-1 transition-colors hover:text-stone-300">
            Home
          </Link>
          <Link href="/explore" className="py-1 transition-colors hover:text-stone-300">
            Explore
          </Link>
          <Link href="/downloaded" className="py-1 transition-colors hover:text-stone-300">
            Downloaded
          </Link>
          <Link href="/about" className="py-1 transition-colors hover:text-stone-300">
            About
          </Link>
          <Link href="/pricing" className="py-1 transition-colors hover:text-stone-300">
            Pricing
          </Link>
          <Link href="/legal/terms" className="py-1 transition-colors hover:text-stone-300">
            Terms
          </Link>
          <Link href="/legal/privacy" className="py-1 transition-colors hover:text-stone-300">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
