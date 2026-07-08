import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icon';
import { LocationCard } from '@/components/location-card';
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

const SECTION_HEADING = 'text-xs font-semibold uppercase tracking-wide text-stone-500';

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
    <div className="mx-auto w-full max-w-shell px-4 py-6">
      <Link
        href={`/explore/${hub.slug}`}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-stone-400 hover:text-stone-200"
      >
        <Icon name="back" size={16} />
        {hub.plural}
      </Link>

      <header className="mt-2">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <Icon name={feature} size={26} weight="fill" />
        </span>
        <h1 className="mt-3 text-2xl font-semibold text-stone-100">
          {hub.plural} in {stateName}
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-400">
          {total > 0
            ? `${countLabel} — mapped with coordinates, difficulty ratings, and conditions reported from the field. Always check current access and weather before you go.`
            : `We are still charting ${pluralLower} in ${stateName}. Explore the map or browse another state below.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/?types=${feature}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-stone-950 transition-colors hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="map" size={18} />
            View on map
          </Link>
          <Link
            href={`/spots?types=${feature}&state=${code}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-700 px-4 text-sm font-medium text-stone-200 transition-colors hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="list" size={18} />
            Search
          </Link>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-stone-800 bg-surface-raised p-6 text-center">
          <div className="flex justify-center text-stone-500">
            <Icon name={feature} size={28} />
          </div>
          <p className="mt-3 text-sm text-stone-300">
            No {pluralLower} charted in {stateName} yet.
          </p>
          <Link
            href={`/explore/${hub.slug}`}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-700 px-5 text-sm font-medium text-accent transition-colors hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            All {pluralLower}
          </Link>
        </div>
      ) : (
        <section aria-label={`${hub.plural} in ${stateName}`} className="mt-6">
          <h2 className={SECTION_HEADING}>{countLabel}</h2>
          <ul className="mt-3 space-y-2">
            {items.map((location) => (
              <li key={location.id}>
                <LocationCard location={location} />
              </li>
            ))}
          </ul>
          {total > items.length && (
            <p className="mt-4 text-sm text-stone-400">
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
      )}

      {otherStates.length > 0 && (
        <section aria-label={`${hub.plural} in other states`} className="mt-8">
          <h2 className={SECTION_HEADING}>{hub.plural} in other states</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {otherStates.map((s) => (
              <li key={s.code}>
                <Link
                  href={`/explore/${hub.slug}/${s.slug}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-stone-800 bg-surface-raised px-3 py-1.5 text-sm text-stone-200 transition-colors hover:border-stone-700 hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span>{s.name}</span>
                  <span className="tabular-nums text-stone-500">{s.count.toLocaleString()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-10 border-t border-stone-800 pt-4">
        <nav aria-label="Related" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
          <Link href="/explore" className="py-1 hover:text-stone-300">
            Explore
          </Link>
          <Link href={`/explore/${hub.slug}`} className="py-1 hover:text-stone-300">
            All {pluralLower}
          </Link>
          <Link href={`/?types=${feature}`} className="py-1 hover:text-stone-300">
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
