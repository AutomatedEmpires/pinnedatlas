import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icon';
import { LocationCard } from '@/components/location-card';
import { Reveal } from '@/components/reveal';
import { badgeClass, buttonClass, cn } from '@/components/ui';
import { CollectionCard } from '@/components/collections/collection-card';
import { COLLECTIONS, getCollection, type CollectionFilter, type CollectionTone } from '@/lib/collections';
import { listLocations } from '@/lib/db/locations';
import { env, hasSupabase } from '@/lib/env';
import { DIFFICULTY_LABELS, FEATURE_TYPE_LABELS } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Tinted icon-chip classes per tone (mirrors the collection card).
const CHIP_TONE: Record<CollectionTone, string> = {
  neutral: 'bg-white/5 text-stone-200 ring-white/10',
  accent: 'bg-accent/10 text-accent ring-accent/25',
  topaz: 'bg-topaz/10 text-topaz ring-topaz/25',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/25',
  violet: 'bg-violet-500/10 text-violet-300 ring-violet-500/25',
  sky: 'bg-sky-500/10 text-sky-300 ring-sky-500/25',
  rose: 'bg-rose-500/10 text-rose-300 ring-rose-500/25',
  teal: 'bg-teal-500/10 text-teal-300 ring-teal-500/25',
};

/** A /spots URL carrying the same filter, so "search all" stays honest. */
function spotsHref(filter: CollectionFilter): string {
  const params = new URLSearchParams();
  if (filter.types?.length) params.set('types', filter.types.join(','));
  if (filter.difficulties?.length) params.set('difficulty', filter.difficulties.join(','));
  if (filter.verifiedOnly) params.set('verified', '1');
  const qs = params.toString();
  return qs ? `/spots?${qs}` : '/spots';
}

/** A map URL scoped to the collection's feature types, when it has any. */
function mapHref(filter: CollectionFilter): string {
  return filter.types?.length ? `/?types=${filter.types.join(',')}` : '/';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: 'Not found' };

  const description = `${collection.blurb} Browse the collection on PinnedAtlas — every spot mapped with difficulty ratings and field-reported conditions.`;
  return {
    title: collection.title,
    description,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: {
      title: `${collection.title} · PinnedAtlas`,
      description: collection.blurb,
      url: `/collections/${collection.slug}`,
      type: 'website',
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const items = hasSupabase ? await listLocations({ ...collection.filter, limit: 60 }) : [];
  const count = items.length;

  // Filter chips describing exactly what this collection selects.
  const filterChips: { label: string; tone: CollectionTone }[] = [
    ...(collection.filter.types ?? []).map((t) => ({
      label: FEATURE_TYPE_LABELS[t],
      tone: collection.tone,
    })),
    ...(collection.filter.difficulties ?? []).map((d) => ({
      label: DIFFICULTY_LABELS[d],
      tone: 'neutral' as CollectionTone,
    })),
    ...(collection.filter.verifiedOnly ? [{ label: 'Verified only', tone: 'accent' as CollectionTone }] : []),
  ];

  const others = COLLECTIONS.filter((c) => c.slug !== collection.slug).slice(0, 3);

  // schema.org CollectionPage + ItemList. Serialized JSON is sanitized (every
  // `<` escaped) before injection to prevent script-context breakout.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.title,
    description: collection.blurb,
    url: `${env.appUrl}/collections/${collection.slug}`,
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
        href="/collections"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-200"
      >
        <Icon name="back" size={16} />
        Collections
      </Link>

      <Reveal>
        <header className="mt-2 max-w-2xl">
          <span
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-inset',
              CHIP_TONE[collection.tone],
            )}
          >
            <Icon name={collection.icon} size={28} weight="fill" />
          </span>
          <span className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            {collection.subtitle}
          </span>
          <h1 className="mt-1.5 font-display text-4xl font-semibold leading-[1.05] text-stone-50 sm:text-5xl">
            {collection.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-400">{collection.blurb}</p>

          {filterChips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {filterChips.map((chip) => (
                <span key={chip.label} className={badgeClass(chip.tone)}>
                  {chip.label}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={mapHref(collection.filter)} className={buttonClass({ variant: 'primary' })}>
              <Icon name="map" size={18} />
              View on map
            </Link>
            <Link
              href={spotsHref(collection.filter)}
              className={buttonClass({ variant: 'secondary' })}
            >
              <Icon name="search" size={18} />
              Search &amp; filter
            </Link>
          </div>
        </header>
      </Reveal>

      {!hasSupabase ? (
        <div className="mt-10 rounded-2xl bg-surface-raised hairline p-8 text-center">
          <p className="text-sm text-stone-300">The atlas is being stocked — check back shortly.</p>
        </div>
      ) : count === 0 ? (
        <div className="mt-10 rounded-2xl bg-surface-raised hairline p-8 text-center">
          <div className="flex justify-center text-stone-500">
            <Icon name={collection.icon} size={30} />
          </div>
          <p className="mt-3 text-sm text-stone-300">
            Nothing charted for this collection yet — the atlas is still filling in.
          </p>
          <Link href="/collections" className={buttonClass({ variant: 'secondary', className: 'mt-5' })}>
            Browse other collections
          </Link>
        </div>
      ) : (
        <Reveal className="mt-10">
          <section aria-label={`Spots in ${collection.title}`}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                {count === 1 ? '1 spot' : `${count} spots`}
                {count === 60 && '+'}
              </h2>
              <Link
                href={spotsHref(collection.filter)}
                className="text-sm font-medium text-accent hover:underline"
              >
                Search all
              </Link>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((location) => (
                <li key={location.id}>
                  <LocationCard location={location} />
                </li>
              ))}
            </ul>
            {count === 60 && (
              <p className="mt-5 text-sm text-stone-400">
                Showing a first 60.{' '}
                <Link
                  href={spotsHref(collection.filter)}
                  className="font-medium text-accent hover:underline"
                >
                  Search the full set
                </Link>
                .
              </p>
            )}
          </section>
        </Reveal>
      )}

      <Reveal className="mt-14">
        <section aria-label="More collections">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            More collections
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((c) => (
              <li key={c.slug}>
                <CollectionCard collection={c} />
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <footer className="mt-12 border-t border-white/8 pt-5">
        <nav aria-label="Related" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
          <Link href="/collections" className="py-1 transition-colors hover:text-stone-300">
            All collections
          </Link>
          <Link href="/explore" className="py-1 transition-colors hover:text-stone-300">
            Explore
          </Link>
          <Link href="/" className="py-1 transition-colors hover:text-stone-300">
            Map
          </Link>
          <Link href="/spots" className="py-1 transition-colors hover:text-stone-300">
            All spots
          </Link>
        </nav>
      </footer>

      {count > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml }} />
      )}
    </div>
  );
}
