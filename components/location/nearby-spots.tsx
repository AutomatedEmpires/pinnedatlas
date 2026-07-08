import Link from 'next/link';
import { Icon } from '@/components/icon';
import { formatDistanceKm } from '@/lib/geo';
import {
  DIFFICULTY_LABELS,
  FEATURE_TYPE_COLORS,
  FEATURE_TYPE_LABELS,
  type DifficultyTier,
  type FeatureType,
} from '@/lib/types';

interface NearbySpot {
  slug: string;
  name: string;
  feature_type: FeatureType;
  difficulty_tier: DifficultyTier;
  distance_m: number;
}

export function NearbySpots({ spots }: { spots: NearbySpot[] }) {
  if (spots.length === 0) return null;

  return (
    <section aria-label="Nearby spots">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Nearby spots</h2>
      <ul className="mt-3 divide-y divide-stone-800/70 overflow-hidden rounded-xl bg-surface-raised">
        {spots.map((s) => {
          const color = FEATURE_TYPE_COLORS[s.feature_type];
          return (
            <li key={s.slug}>
              <Link
                href={`/location/${s.slug}`}
                className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-surface-overlay focus-visible:bg-surface-overlay focus-visible:outline-none"
              >
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  <Icon name={s.feature_type} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-stone-100">{s.name}</span>
                  <span className="mt-0.5 block text-xs text-stone-400">
                    {FEATURE_TYPE_LABELS[s.feature_type]} · {DIFFICULTY_LABELS[s.difficulty_tier]}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium tabular-nums text-stone-400">
                  {formatDistanceKm(s.distance_m / 1000)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
