'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { cn } from '@/components/ui';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_TIERS,
  FEATURE_TYPES,
  FEATURE_TYPE_LABELS,
} from '@/lib/types';

const CHIP_BASE =
  'inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-all duration-200 ease-spring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97]';
const CHIP_ON =
  'border-accent/50 bg-accent/10 text-accent shadow-[0_0_20px_-8px_rgba(52,211,153,0.55)]';
const CHIP_OFF =
  'border-white/10 bg-white/[0.03] text-stone-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-stone-100';

// Horizontal-scroll rows on mobile; wrap freely from md up. Scrollbars hidden.
const SCROLLER =
  'flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

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
    'inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-all duration-200 ease-spring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

  return (
    <section
      aria-label="Filter and sort spots"
      className="mt-6 space-y-4 rounded-2xl bg-surface-raised p-4 shadow-card hairline sm:p-5"
    >
      {/* Sort + Near me */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div
          role="group"
          aria-label="Sort order"
          className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1"
        >
          <button
            type="button"
            aria-pressed={!nearestActive}
            onClick={selectName}
            className={cn(
              segBase,
              !nearestActive
                ? 'bg-accent text-stone-950 shadow-[0_6px_18px_-10px_rgba(52,211,153,0.7)]'
                : 'text-stone-400 hover:text-stone-100',
            )}
          >
            Name
          </button>
          <button
            type="button"
            aria-pressed={nearestActive}
            onClick={selectNearest}
            className={cn(
              segBase,
              nearestActive
                ? 'bg-accent text-stone-950 shadow-[0_6px_18px_-10px_rgba(52,211,153,0.7)]'
                : 'text-stone-400 hover:text-stone-100',
            )}
          >
            Nearest
          </button>
        </div>

        {near ? (
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-3.5 text-sm font-medium text-accent">
            <Icon name="pin" size={14} weight="fill" />
            Near you
            <button
              type="button"
              onClick={clearNear}
              aria-label="Clear your location"
              className="-mr-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-accent/80 transition-colors hover:bg-white/10 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            >
              <Icon name="close" size={14} />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={requestNearMe}
            disabled={locating}
            className={cn(CHIP_BASE, CHIP_OFF, 'disabled:opacity-60')}
          >
            {locating ? (
              <Icon name="spinner" size={16} className="animate-spin" />
            ) : (
              <Icon name="pin" size={16} />
            )}
            {locating ? 'Locating…' : 'Near me'}
          </button>
        )}

        {hasAnyParam && (
          <Link
            href="/spots"
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-stone-400 transition-colors hover:text-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="close" size={14} />
            Clear all
          </Link>
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
              className={cn(CHIP_BASE, on ? CHIP_ON : CHIP_OFF)}
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
              className={cn(CHIP_BASE, on ? CHIP_ON : CHIP_OFF)}
            >
              {DIFFICULTY_LABELS[tier]}
            </button>
          );
        })}
      </FilterRow>

      {/* Verified only */}
      <FilterRow label="Trust">
        <button
          type="button"
          aria-pressed={verifiedOnly}
          onClick={toggleVerified}
          className={cn(CHIP_BASE, verifiedOnly ? CHIP_ON : CHIP_OFF)}
        >
          <Icon name="verified" size={16} weight={verifiedOnly ? 'fill' : 'regular'} />
          Verified only
        </button>
      </FilterRow>
    </section>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-4">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500 md:min-w-[72px] md:pt-3">
        {label}
      </span>
      <div role="group" aria-label={`Filter by ${label.toLowerCase()}`} className={cn(SCROLLER, 'flex-1')}>
        {children}
      </div>
    </div>
  );
}
