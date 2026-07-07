'use client';

// Horizontal chip row for filtering by feature type. State lives in the URL
// ('types' search param, comma-separated) so the map/list re-query on change.

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FEATURE_TYPES, FEATURE_TYPE_LABELS, type FeatureType } from '@/lib/types';
import { Icon } from '@/components/icon';

const CHIP_BASE =
  'inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const CHIP_ACTIVE = 'bg-accent-soft text-emerald-50 ring-1 ring-accent';
const CHIP_INACTIVE =
  'bg-surface-raised/90 text-stone-300 ring-1 ring-stone-700 backdrop-blur hover:text-stone-100';

export function MapFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = new Set(
    (searchParams.get('types') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is FeatureType => (FEATURE_TYPES as string[]).includes(s)),
  );

  function apply(next: Set<FeatureType>) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.size === 0 || next.size === FEATURE_TYPES.length) {
      params.delete('types');
    } else {
      params.set('types', FEATURE_TYPES.filter((t) => next.has(t)).join(','));
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggle(type: FeatureType) {
    const next = new Set(active);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    apply(next);
  }

  return (
    <div
      role="group"
      aria-label="Filter by feature type"
      className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        onClick={() => apply(new Set())}
        aria-pressed={active.size === 0}
        className={`${CHIP_BASE} ${active.size === 0 ? CHIP_ACTIVE : CHIP_INACTIVE}`}
      >
        All
      </button>
      {FEATURE_TYPES.map((type) => {
        const isActive = active.has(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            aria-pressed={isActive}
            className={`${CHIP_BASE} ${isActive ? CHIP_ACTIVE : CHIP_INACTIVE}`}
          >
            <Icon name={type} size={16} />
            {FEATURE_TYPE_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}
