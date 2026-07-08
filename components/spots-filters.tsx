'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_TIERS,
  FEATURE_TYPES,
  FEATURE_TYPE_LABELS,
} from '@/lib/types';

const CHIP_BASE =
  'inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const CHIP_ON = 'border-transparent bg-accent-soft text-emerald-50 ring-1 ring-accent';
const CHIP_OFF =
  'border-stone-800 bg-surface-raised text-stone-300 hover:border-stone-600 hover:text-stone-100';

// Hide scrollbars on the horizontal chip rows while keeping them scrollable.
const SCROLLER =
  'flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function SpotsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const activeTypes = (searchParams.get('types') ?? '').split(',').filter(Boolean);
  const activeDifficulties = (searchParams.get('difficulty') ?? '').split(',').filter(Boolean);
  const verifiedOnly = searchParams.get('verified') === '1';
  const near = searchParams.get('near');
  const nearestActive = Boolean(near) || searchParams.get('sort') === 'nearest';

  const hasAnyParam = ['q', 'types', 'difficulty', 'verified', 'state', 'near', 'sort'].some((k) =>
    searchParams.get(k),
  );

  /** Build a same-page URL from the current params with `mutate` applied. */
  function buildUrl(mutate: (params: URLSearchParams) => void): string {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function apply(mutate: (params: URLSearchParams) => void) {
    router.replace(buildUrl(mutate), { scroll: false });
  }

  function toggleInList(key: 'types' | 'difficulty', value: string) {
    apply((params) => {
      const list = (params.get(key) ?? '').split(',').filter(Boolean);
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      if (next.length) params.set(key, next.join(','));
      else params.delete(key);
    });
  }

  function toggleVerified() {
    apply((params) => {
      if (params.get('verified') === '1') params.delete('verified');
      else params.set('verified', '1');
    });
  }

  function requestNearMe() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoError('Location is not available on this device.');
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const lat = position.coords.latitude.toFixed(5);
        const lng = position.coords.longitude.toFixed(5);
        apply((params) => {
          params.set('near', `${lat},${lng}`);
          params.set('sort', 'nearest');
        });
      },
      (error) => {
        setLocating(false);
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? 'Location access was denied — enable it to sort by distance.'
            : 'Could not get your location. Try again.',
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  function selectName() {
    setGeoError(null);
    apply((params) => {
      params.delete('near');
      params.delete('sort');
    });
  }

  function selectNearest() {
    if (near) {
      apply((params) => params.set('sort', 'nearest'));
    } else {
      requestNearMe();
    }
  }

  function clearNear() {
    setGeoError(null);
    apply((params) => {
      params.delete('near');
      params.delete('sort');
    });
  }

  const segBase =
    'inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

  return (
    <section aria-label="Filter and sort spots" className="mt-4 space-y-3">
      {/* Sort + Near me */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Sort order"
          className="inline-flex rounded-lg border border-stone-800 bg-surface-raised p-0.5"
        >
          <button
            type="button"
            aria-pressed={!nearestActive}
            onClick={selectName}
            className={`${segBase} ${
              !nearestActive ? 'bg-accent text-stone-950' : 'text-stone-300 hover:text-stone-100'
            }`}
          >
            Name
          </button>
          <button
            type="button"
            aria-pressed={nearestActive}
            onClick={selectNearest}
            className={`${segBase} ${
              nearestActive ? 'bg-accent text-stone-950' : 'text-stone-300 hover:text-stone-100'
            }`}
          >
            Nearest
          </button>
        </div>

        {near ? (
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-transparent bg-accent-soft px-3 text-sm font-medium text-emerald-50 ring-1 ring-accent">
            <Icon name="pin" size={14} weight="fill" />
            Near you
            <button
              type="button"
              onClick={clearNear}
              aria-label="Clear your location"
              className="-mr-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-emerald-100/80 hover:bg-black/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            >
              <Icon name="close" size={14} />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={requestNearMe}
            disabled={locating}
            className={`${CHIP_BASE} ${CHIP_OFF} disabled:opacity-60`}
          >
            {locating ? (
              <Icon name="spinner" size={16} className="animate-spin" />
            ) : (
              <Icon name="pin" size={16} />
            )}
            {locating ? 'Locating…' : 'Near me'}
          </button>
        )}
      </div>

      {geoError && (
        <p role="alert" className="text-xs text-rose-400">
          {geoError}
        </p>
      )}

      {/* Feature type */}
      <FilterRow label="Type">
        {FEATURE_TYPES.map((type) => {
          const on = activeTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={on}
              onClick={() => toggleInList('types', type)}
              className={`${CHIP_BASE} ${on ? CHIP_ON : CHIP_OFF}`}
            >
              <Icon name={type} size={14} weight={on ? 'fill' : 'regular'} />
              {FEATURE_TYPE_LABELS[type]}
            </button>
          );
        })}
      </FilterRow>

      {/* Difficulty */}
      <FilterRow label="Difficulty">
        {DIFFICULTY_TIERS.map((tier) => {
          const on = activeDifficulties.includes(tier);
          return (
            <button
              key={tier}
              type="button"
              aria-pressed={on}
              onClick={() => toggleInList('difficulty', tier)}
              className={`${CHIP_BASE} ${on ? CHIP_ON : CHIP_OFF}`}
            >
              {DIFFICULTY_LABELS[tier]}
            </button>
          );
        })}
      </FilterRow>

      {/* Verified + clear all */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <button
          type="button"
          aria-pressed={verifiedOnly}
          onClick={toggleVerified}
          className={`${CHIP_BASE} ${verifiedOnly ? CHIP_ON : CHIP_OFF}`}
        >
          <Icon name="verified" size={16} weight={verifiedOnly ? 'fill' : 'regular'} />
          Verified only
        </button>

        {hasAnyParam && (
          <Link
            href="/spots"
            className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-stone-400 underline-offset-2 hover:text-stone-200 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Clear all
          </Link>
        )}
      </div>
    </section>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <div role="group" aria-label={`Filter by ${label.toLowerCase()}`} className={SCROLLER}>
        {children}
      </div>
    </div>
  );
}
