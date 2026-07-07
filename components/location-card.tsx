import Link from 'next/link';
import { Icon } from '@/components/icon';
import { formatDistanceKm } from '@/lib/geo';
import {
  DIFFICULTY_LABELS,
  FEATURE_TYPE_COLORS,
  FEATURE_TYPE_LABELS,
  type LocationRecord,
} from '@/lib/types';

const BADGE = 'rounded bg-stone-800 px-1.5 py-0.5 text-stone-300';

export function LocationCard({
  location,
  distanceKm,
}: {
  location: LocationRecord;
  distanceKm?: number;
}) {
  const color = FEATURE_TYPE_COLORS[location.feature_type];

  return (
    <Link
      href={`/location/${location.slug}`}
      className="flex items-center gap-3 rounded-xl bg-surface-raised p-3 transition-colors hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        // 33 = 20% alpha in hex; keeps disc tint in sync with map pin colors.
        style={{ backgroundColor: `${color}33`, color }}
      >
        <Icon name={location.feature_type} size={22} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-stone-100">{location.name}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className={BADGE}>{FEATURE_TYPE_LABELS[location.feature_type]}</span>
          <span className={BADGE}>{DIFFICULTY_LABELS[location.difficulty_tier]}</span>
          {location.state_code && <span className={BADGE}>{location.state_code}</span>}
          {location.moderation_status === 'verified' ? (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">
              <Icon name="verified" size={12} weight="fill" />
              Verified
            </span>
          ) : (
            <span className="rounded bg-stone-800 px-1.5 py-0.5 text-stone-400">Community</span>
          )}
        </span>
      </span>

      {distanceKm !== undefined && (
        <span className="shrink-0 text-sm text-stone-400">{formatDistanceKm(distanceKm)}</span>
      )}
    </Link>
  );
}
