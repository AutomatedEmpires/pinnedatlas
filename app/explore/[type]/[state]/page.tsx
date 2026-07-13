import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icon';
import { LocationCard } from '@/components/location-card';
import { Reveal } from '@/components/reveal';
import { buttonClass, cardClass } from '@/components/ui';
import { getServiceClient } from '@/lib/db/client';
import { listLocations } from '@/lib/db/locations';
import { env, hasSupabase } from '@/lib/env';
import {
  CODE_TO_STATE_NAME,
  COVERED_STATES,
  codeToStateSlug,
  hubForSlug,
  stateSlugToCode,
  typeForSlug,
} from '@/lib/hubs';
import { FEATURE_TYPE_COLORS, type FeatureType, type LocationRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Public count of one feature type in one state via a light head query. */
async function countInState(feature: FeatureType, code: string): Promise<number> {
  const db = getServiceClient();
  if (!db) return 0;
  const { count, error } = await db
    .from('location')
    .select('id', { count: 'exact', head: true })
    .eq('feature_type', feature)
    .eq('state_code', code)
    .eq('display_hidden', false)
    .in('moderation_status', ['verified', 'community']);
  if (error) return 0;
  return count ?? 0;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; state: string }>;
}): Promise<Metadata> {
  const { type, state } = await params;
  const feature = typeForSlug(type);
  const hub = hubForSlug(type);
  const code = stateSlugToCode(state);
  if (!feature || !hub || !code || !COVERED_STATES.includes(code)) {
    return { title: 'Not found' };
  }

  const stateName = CODE_TO_STATE_NAME[code];
  const total = hasSupabase ? await countInState(feature, code) : 0;
  const countLabel = total > 0 ? ` (${total.toLocaleString()})` : '';
  const description = `Explore ${hub.plural.toLowerCase()} in ${stateName} — locations, difficulty ratings, seasonal conditions, and access notes, with every spot mapped on PinnedAtlas.`;

  return {
    title: `${hub.plural} in ${stateName}${countLabel}`,
    description,
    alternates: { canonical: `/explore/${hub.slug}/${state}` },
    openGraph: {
      title: `${hub.plural} in ${stateName}`,
      description,
      url: `/explore/${hub.slug}/${state}`,
      type: 'website',
    },
  };
}

export default async function TypeStateHubPage({
  params,
}: {
  params: Promise<{ type: string; state: string }>;
}) {
  const { type, state } = await params;
  const feature = typeForSlug(type);
  const hub = hubForSlug(type);
  const code = stateSlugToCode(state);
  if (!feature || !hub || !code || !COVERED_STATES.includes(code)) notFound();

  const stateName = CODE_TO_STATE_NAME[code];
  const color = FEATURE_TYPE_COLORS[feature];

  // Counts for every covered state (drives the true total + honest cross-links),
  // plus the actual spots to render, fetched in parallel.
  const [counts, items] = await Promise.all([
    hasSupabase
      ? Promise.all(
          COVERED_STATES.map(async (c) => ({ code: c, count: await countInState(feature, c) })),
        )
      : Promise.resolve([] as { code: string; count: number }[]),
    hasSupabase
      ? listLocations({ types: [feature], state: code, limit: 200 })
      : Promise.resolve([] as LocationRecord[]),
  ]);

  const total = counts.find((c) => c.code === code)?.count ?? items.length;
  const otherStates = counts
    .filter((c) => c.code !== code && c.count > 0)
    .map((c) => ({
      code: c.code,
      name: CODE_TO_STATE_NAME[c.code],
      slug: codeToStateSlug(c.code),
      count: c.count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const pluralLower = hub.plural.toLowerCase();
  const countLabel = `${total.toLocaleString()} ${total === 1 ? hub.label.toLowerCase() : pluralLower} in ${stateName}`;

  // schema.org CollectionPage + ItemList. Serialized JSON is sanitized (every
  // `<` escaped) before injection to prevent script-context breakout.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${hub.plural} in ${stateName}`,
    description: `${hub.plural} to explore in ${stateName} on PinnedAtlas.`,
    url: `${env.appUrl}/explore/${hub.slug}/${state}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((loc, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${env.appUrl}/location/${loc.slug}`,
        name: loc.name,
      })),
    },
  };
  const jsonLdHtml = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <div className="mx-auto w-full max-w-content px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Link
        href={`/explore/${hub.slug}`}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-200"
      >
        <Icon name="back" size={16} />
        {hub.plural}
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
            {stateName}
          </span>
          <h1 className="mt-1.5 font-display text-4xl font-semibold leading-[1.05] text-stone-50 sm:text-5xl">
            {hub.plural} in {stateName}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-400">
            {total > 0
              ? `${countLabel} — mapped with coordinates, difficulty ratings, and conditions reported from the field. Always check current access and weather before you go.`
              : `We are still charting ${pluralLower} in ${stateName}. Explore the map or browse another state below.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/?types=${feature}`} className={buttonClass({ variant: 'primary' })}>
              <Icon name="map" size={18} />
              View on map
            </Link>
            <Link
              href={`/spots?types=${feature}&state=${code}`}
              className={buttonClass({ variant: 'secondary' })}
            >
              <Icon name="list" size={18} />
              Search
            </Link>
          </div>
        </header>
      </Reveal>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-surface-raised hairline p-8 text-center">
          <div className="flex justify-center text-stone-500">
            <Icon name={feature} size={30} />
          </div>
          <p className="mt-3 text-sm text-stone-300">
            No {pluralLower} charted in {stateName} yet.
          </p>
          <Link
            href={`/explore/${hub.slug}`}
            className={buttonClass({ variant: 'secondary', className: 'mt-5' })}
          >
            All {pluralLower}
          </Link>
        </div>
      ) : (
        <Reveal className="mt-10">
          <section aria-label={`${hub.plural} in ${stateName}`}>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              {countLabel}
            </span>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((location) => (
                <li key={location.id}>
                  <LocationCard location={location} />
                </li>
              ))}
            </ul>
            {total > items.length && (
              <p className="mt-5 text-sm text-stone-400">
                Showing the first {items.length.toLocaleString()}.{' '}
                <Link
                  href={`/spots?types=${feature}&state=${code}`}
                  className="font-medium text-accent hover:underline"
                >
                  Search all {pluralLower} in {stateName}
                </Link>
                .
              </p>
            )}
          </section>
        </Reveal>
      )}

      {otherStates.length > 0 && (
        <Reveal className="mt-12">
          <section aria-label={`${hub.plural} in other states`}>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              {hub.plural} in other states
            </span>
            <ul className="mt-4 flex flex-wrap gap-2">
              {otherStates.map((s) => (
                <li key={s.code}>
                  <Link
                    href={`/explore/${hub.slug}/${s.slug}`}
                    className={cardClass({
                      hover: true,
                      className:
                        'inline-flex min-h-11 items-center gap-1.5 px-3 py-1.5 text-sm text-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    })}
                  >
                    <span>{s.name}</span>
                    <span className="tabular-nums text-stone-500">{s.count.toLocaleString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      <footer className="mt-12 border-t border-white/8 pt-5">
        <nav aria-label="Related" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
          <Link href="/explore" className="py-1 transition-colors hover:text-stone-300">
            Explore
          </Link>
          <Link href={`/explore/${hub.slug}`} className="py-1 transition-colors hover:text-stone-300">
            All {pluralLower}
          </Link>
          <Link href="/collections" className="py-1 transition-colors hover:text-stone-300">
            Collections
          </Link>
          <Link href={`/?types=${feature}`} className="py-1 transition-colors hover:text-stone-300">
            Map
          </Link>
        </nav>
      </footer>

      {items.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml }} />
      )}
    </div>
  );
}
