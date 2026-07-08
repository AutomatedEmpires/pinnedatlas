import Link from 'next/link';
import { Icon } from '@/components/icon';
import { formatDistanceKm } from '@/lib/geo';
import {
  DIFFICULTY_LABELS,
  FEATURE_TYPE_COLORS,
  FEATURE_TYPE_LABELS,
  type LocationRecord,
} from '@/lib/types';

// Small neutral meta pill shared by the type / difficulty / state chips.
const META_PILL =
  'inline-flex items-center rounded-md bg-surface-overlay px-1.5 py-0.5 text-stone-300';

/**
 * Presentational card for a single location. Prop shape is intentionally
 * unchanged (`{ location, distanceKm? }`) so /my and other callers keep working.
 */
export function LocationCard({
  location,
  distanceKm,
}: {
  location: LocationRecord;
  distanceKm?: number;
}) {
  const color = FEATURE_TYPE_COLORS[location.feature_type];
  const isVerified = location.moderation_status === 'verified';

  return (
    <Link
      href={`/location/${location.slug}`}
      className="flex min-h-16 items-center gap-3 rounded-xl border border-stone-800 bg-surface-raised p-3 transition-colors hover:border-stone-700 hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        // 22 = ~13% alpha in hex; keeps the disc tint in sync with map pin colors.
        style={{ backgroundColor: `${color}22`, color }}
      >
        <Icon name={location.feature_type} size={22} weight="fill" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-stone-100">{location.name}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] leading-none">
          <span className={META_PILL}>{FEATURE_TYPE_LABELS[location.feature_type]}</span>
          <span className={META_PILL}>{DIFFICULTY_LABELS[location.difficulty_tier]}</span>
          {location.state_code && <span className={META_PILL}>{location.state_code}</span>}
          {isVerified ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 font-medium text-accent">
              <Icon name="verified" size={12} weight="fill" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-overlay px-1.5 py-0.5 text-stone-400">
              <Icon name="community" size={12} />
              Community
            </span>
          )}
        </span>
      </span>

      {distanceKm !== undefined && (
        <span className="shrink-0 self-center text-sm font-medium tabular-nums text-stone-300">
          {formatDistanceKm(distanceKm)}
        </span>
      )}
    </Link>
  );
}
