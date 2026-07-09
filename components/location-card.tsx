import Link from 'next/link';
import { Icon } from '@/components/icon';
import { badgeClass } from '@/components/ui';
import { formatDistanceKm } from '@/lib/geo';
import {
  DIFFICULTY_LABELS,
  FEATURE_TYPE_COLORS,
  FEATURE_TYPE_LABELS,
  type FeatureType,
  type LocationRecord,
} from '@/lib/types';

const TYPE_TONE: Record<FeatureType, 'violet' | 'sky' | 'rose' | 'teal' | 'neutral'> = {
  cave: 'violet',
  waterfall: 'sky',
  hot_spring: 'rose',
  spring: 'teal',
  other: 'neutral',
};

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
      className="group flex min-h-[68px] items-center gap-3.5 rounded-2xl bg-surface-raised p-3 pr-4 hairline transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:bg-surface-overlay hover:shadow-float focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/5 transition-transform duration-200 ease-spring group-hover:scale-105"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        <Icon name={location.feature_type} size={22} weight="fill" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-stone-50">{location.name}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] leading-none">
          <span className={badgeClass(TYPE_TONE[location.feature_type])}>
            {FEATURE_TYPE_LABELS[location.feature_type]}
          </span>
          <span className={badgeClass('neutral')}>
            {DIFFICULTY_LABELS[location.difficulty_tier]}
          </span>
          {location.state_code && (
            <span className="text-stone-500">{location.state_code}</span>
          )}
          {isVerified && (
            <span className={badgeClass('accent')}>
              <Icon name="verified" size={11} weight="fill" />
              Verified
            </span>
          )}
        </span>
      </span>

      {distanceKm !== undefined ? (
        <span className="shrink-0 self-center text-sm font-medium tabular-nums text-stone-300">
          {formatDistanceKm(distanceKm)}
        </span>
      ) : (
        <Icon
          name="directions"
          size={16}
          className="shrink-0 -rotate-90 text-stone-600 transition-colors group-hover:text-accent"
        />
      )}
    </Link>
  );
}
