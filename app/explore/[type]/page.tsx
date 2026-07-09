import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icon';
import { LocationCard } from '@/components/location-card';
import { Reveal } from '@/components/reveal';
import { buttonClass, cardClass } from '@/components/ui';
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
  const pluralLower = hub.plural.toLowerCase();

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
  const total = states.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="mx-auto w-full max-w-content px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Link
        href="/explore"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-200"
      >
        <Icon name="back" size={16} />
        Explore
      </Link>

      <Reveal>
        <header className="mt-2 max-w-2xl">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-inset ring-white/5"
            style={{ backgroundColor: `${color}1f`, color }}
          >
            <Icon name={feature} size={28} weight="fill" />
          </span>
          <span className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Field guide
          </span>
          <h1 className="mt-1.5 font-display text-4xl font-semibold leading-[1.05] text-stone-50 sm:text-5xl">
            {hub.plural}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-400">{hub.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/?types=${feature}`} className={buttonClass({ variant: 'primary' })}>
              <Icon name="map" size={18} />
              View on map
            </Link>
            <Link href={`/spots?types=${feature}`} className={buttonClass({ variant: 'secondary' })}>
              <Icon name="list" size={18} />
              Search all
            </Link>
          </div>
        </header>
      </Reveal>

      <Reveal className="mt-12">
        <section aria-label={`${hub.plural} by state`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              By state
            </span>
            {total > 0 && (
              <span className="text-xs tabular-nums text-stone-500">
                {total.toLocaleString()} mapped across {states.length}{' '}
                {states.length === 1 ? 'state' : 'states'}
              </span>
            )}
          </div>
          {states.length === 0 ? (
            <p className="mt-4 text-sm text-stone-400">
              State-by-state guides are coming as the atlas fills in.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {states.map((s) => (
                <li key={s.code}>
                  <Link
                    href={`/explore/${hub.slug}/${s.slug}`}
                    className={cardClass({
                      hover: true,
                      className:
                        'group flex min-h-14 items-center justify-between gap-3 px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    })}
                  >
                    <span className="font-medium text-stone-100">{s.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-sm tabular-nums text-stone-400">
                        {s.count.toLocaleString()}
                      </span>
                      <Icon
                        name="directions"
                        size={14}
                        className="-rotate-90 text-stone-600 transition-colors group-hover:text-accent"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>

      {popular.length > 0 && (
        <Reveal className="mt-12">
          <section aria-label={`Popular ${pluralLower}`}>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              Popular {pluralLower}
            </span>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((location) => (
                <li key={location.id}>
                  <LocationCard location={location} />
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      <Reveal className="mt-12">
        <Link
          href="/collections"
          className={cardClass({
            hover: true,
            className:
              'group flex items-center justify-between gap-4 p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          })}
        >
          <span className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-topaz/10 text-topaz ring-1 ring-inset ring-topaz/25">
              <Icon name="premium" size={20} weight="fill" />
            </span>
            <span>
              <span className="block font-display text-base font-semibold text-stone-50">
                Curated collections
              </span>
              <span className="mt-0.5 block text-sm text-stone-400">
                Editor&rsquo;s picks grouped by season, difficulty &amp; character
              </span>
            </span>
          </span>
          <Icon
            name="directions"
            size={16}
            className="-rotate-90 shrink-0 text-stone-600 transition-colors group-hover:text-topaz"
          />
        </Link>
      </Reveal>

      <footer className="mt-12 border-t border-white/8 pt-5">
        <nav aria-label="Related" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
          <Link href="/explore" className="py-1 transition-colors hover:text-stone-300">
            All guides
          </Link>
          <Link href="/collections" className="py-1 transition-colors hover:text-stone-300">
            Collections
          </Link>
          <Link href={`/?types=${feature}`} className="py-1 transition-colors hover:text-stone-300">
            {hub.plural} on the map
          </Link>
          <Link
            href={`/spots?types=${feature}`}
            className="py-1 transition-colors hover:text-stone-300"
          >
            Search {pluralLower}
          </Link>
        </nav>
      </footer>
    </div>
  );
}
