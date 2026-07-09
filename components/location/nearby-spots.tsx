import Link from 'next/link';
import { Icon } from '@/components/icon';
import { SectionHeading, badgeClass } from '@/components/ui';
import { formatDistanceKm } from '@/lib/geo';
import {
  DIFFICULTY_LABELS,
  FEATURE_TYPE_COLORS,
  FEATURE_TYPE_LABELS,
  type DifficultyTier,
  type FeatureType,
} from '@/lib/types';

const TYPE_TONE: Record<FeatureType, 'violet' | 'sky' | 'rose' | 'teal' | 'neutral'> = {
  cave: 'violet',
  waterfall: 'sky',
  hot_spring: 'rose',
  spring: 'teal',
  other: 'neutral',
};

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
      <SectionHeading eyebrow="Explore" title="Nearby spots" className="mb-4" />
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {spots.map((s) => {
          const color = FEATURE_TYPE_COLORS[s.feature_type];
          return (
            <li key={s.slug}>
              <Link
                href={`/location/${s.slug}`}
                className="group flex min-h-[68px] items-center gap-3.5 rounded-2xl bg-surface-raised p-3 pr-4 hairline transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:bg-surface-overlay hover:shadow-float focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/5 transition-transform duration-200 ease-spring group-hover:scale-105"
                  style={{ backgroundColor: `${color}1f`, color }}
                >
                  <Icon name={s.feature_type} size={20} weight="fill" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-stone-50">{s.name}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] leading-none">
                    <span className={badgeClass(TYPE_TONE[s.feature_type])}>
                      {FEATURE_TYPE_LABELS[s.feature_type]}
                    </span>
                    <span className={badgeClass('neutral')}>
                      {DIFFICULTY_LABELS[s.difficulty_tier]}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 self-center text-sm font-medium tabular-nums text-stone-300">
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
