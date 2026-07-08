import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icon';
import { LocationCard } from '@/components/location-card';
import { getServiceClient } from '@/lib/db/client';
import { listLocations } from '@/lib/db/locations';
import { hasSupabase } from '@/lib/env';
import {
  CODE_TO_STATE_NAME,
  COVERED_STATES,
  TYPE_HUBS,
  codeToStateSlug,
  hubForSlug,
  typeForSlug,
} from '@/lib/hubs';
import { FEATURE_TYPE_COLORS, type FeatureType, type LocationRecord } from '@/lib/types';

const SECTION_HEADING = 'text-xs font-semibold uppercase tracking-wide text-stone-500';

export function generateStaticParams() {
  return TYPE_HUBS.map((hub) => ({ type: hub.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const hub = hubForSlug(type);
  if (!hub) return { title: 'Not found' };

  const description = `Find ${hub.plural.toLowerCase()} across 16 US states — with accurate maps, difficulty ratings, seasonal conditions, and access notes. Browse by state or open them on the map.`;
  return {
    title: `${hub.plural} to explore`,
    description,
    alternates: { canonical: `/explore/${hub.slug}` },
    openGraph: {
      title: `${hub.plural} to explore`,
      description,
      url: `/explore/${hub.slug}`,
      type: 'website',
    },
  };
}

/** Public count of one feature type in one state via a light head query. */
async function countInState(feature: FeatureType, code: string): Promise<number> {
  const db = getServiceClient();
  if (!db) return 0;
  const { count, error } = await db
    .from('location')
    .select('id', { count: 'exact', head: true })
    .eq('feature_type', feature)
    .eq('state_code', code)
    .in('moderation_status', ['verified', 'community']);
  if (error) return 0;
  return count ?? 0;
}

export default async function TypeHubPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const feature = typeForSlug(type);
  const hub = hubForSlug(type);
  if (!feature || !hub) notFound();

  const color = FEATURE_TYPE_COLORS[feature];

  // Real per-state counts (~16 head queries) plus a sample of popular spots.
  const [counts, popular] = await Promise.all([
    hasSupabase
      ? Promise.all(
          COVERED_STATES.map(async (code) => ({
            code,
            name: CODE_TO_STATE_NAME[code],
            slug: codeToStateSlug(code),
            count: await countInState(feature, code),
          })),
        )
      : Promise.resolve([] as { code: string; name: string; slug: string; count: number }[]),
    hasSupabase
      ? listLocations({ types: [feature], limit: 24 })
      : Promise.resolve([] as LocationRecord[]),
  ]);

  // Show only states that actually have this feature, most-populous first.
  const states = counts
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return (
    <div className="mx-auto w-full max-w-shell px-4 py-6">
      <Link
        href="/explore"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-stone-400 hover:text-stone-200"
      >
        <Icon name="back" size={16} />
        Explore
      </Link>

      <header className="mt-2">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <Icon name={feature} size={26} weight="fill" />
        </span>
        <h1 className="mt-3 text-2xl font-semibold text-stone-100">{hub.plural}</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-400">{hub.intro}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/?types=${feature}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-stone-950 transition-colors hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="map" size={18} />
            View on map
          </Link>
          <Link
            href={`/spots?types=${feature}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-700 px-4 text-sm font-medium text-stone-200 transition-colors hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="list" size={18} />
            Search all
          </Link>
        </div>
      </header>

      <section aria-label={`${hub.plural} by state`} className="mt-8">
        <h2 className={SECTION_HEADING}>By state</h2>
        {states.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">
            State-by-state guides are coming as the atlas fills in.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {states.map((s) => (
              <li key={s.code}>
                <Link
                  href={`/explore/${hub.slug}/${s.slug}`}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-stone-800 bg-surface-raised px-3 py-2 transition-colors hover:border-stone-700 hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="font-medium text-stone-100">{s.name}</span>
                  <span className="shrink-0 text-sm tabular-nums text-stone-400">
                    {s.count.toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {popular.length > 0 && (
        <section aria-label={`Popular ${hub.plural.toLowerCase()}`} className="mt-8">
          <h2 className={SECTION_HEADING}>Popular {hub.plural.toLowerCase()}</h2>
          <ul className="mt-3 space-y-2">
            {popular.map((location) => (
              <li key={location.id}>
                <LocationCard location={location} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-10 border-t border-stone-800 pt-4">
        <nav aria-label="Related" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
          <Link href="/explore" className="py-1 hover:text-stone-300">
            All guides
          </Link>
          <Link href={`/?types=${feature}`} className="py-1 hover:text-stone-300">
            {hub.plural} on the map
          </Link>
          <Link href={`/spots?types=${feature}`} className="py-1 hover:text-stone-300">
            Search {hub.plural.toLowerCase()}
          </Link>
        </nav>
      </footer>
    </div>
  );
}
