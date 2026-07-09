import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { Reveal } from '@/components/reveal';
import { SectionHeading, buttonClass } from '@/components/ui';
import { CollectionCard } from '@/components/collections/collection-card';
import { COLLECTIONS } from '@/lib/collections';

export const metadata: Metadata = {
  title: 'Collections',
  description:
    'Curated ways into the atlas — roadside wonders, waterfall season, winter hot springs, and more. Hand-picked lenses onto caves, waterfalls, hot springs, and springs across the US.',
  alternates: { canonical: '/collections' },
  openGraph: {
    title: 'Collections · PinnedAtlas',
    description:
      'Curated ways into the atlas — roadside wonders, waterfall season, winter hot springs, and more.',
    url: '/collections',
    type: 'website',
  },
};

export default function CollectionsPage() {
  return (
    <div className="mx-auto w-full max-w-content px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Reveal>
        <header className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-topaz">
            <Icon name="premium" size={13} weight="fill" />
            Editor&rsquo;s picks
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] text-stone-50 sm:text-5xl">
            Collections
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-400">
            Curated ways into the atlas — grouped by season, difficulty, and character. Each is an
            honest filter over real, mapped locations, framed for how people actually plan a trip.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/explore" className={buttonClass({ variant: 'secondary' })}>
              <Icon name="compass" size={18} />
              Explore by type &amp; region
            </Link>
            <Link href="/spots" className={buttonClass({ variant: 'ghost' })}>
              <Icon name="list" size={18} />
              Browse all spots
            </Link>
          </div>
        </header>
      </Reveal>

      <Reveal className="mt-10 sm:mt-12">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((collection) => (
            <li key={collection.slug}>
              <CollectionCard collection={collection} />
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mt-14">
        <section
          aria-label="Keep exploring"
          className="rounded-3xl bg-surface-raised hairline p-6 sm:p-8"
        >
          <SectionHeading
            eyebrow="Keep exploring"
            title="Not sure where to start?"
          />
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
            Open the live map to see everything at once, or dig into a single feature type and
            state-by-state guides.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/" className={buttonClass({ variant: 'primary' })}>
              <Icon name="map" size={18} />
              Open the map
            </Link>
            <Link href="/explore" className={buttonClass({ variant: 'secondary' })}>
              <Icon name="compass" size={18} />
              Explore guides
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
