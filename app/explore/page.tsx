import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { Reveal } from '@/components/reveal';
import { SectionHeading, buttonClass, cardClass } from '@/components/ui';
import { CollectionCard } from '@/components/collections/collection-card';
import { COLLECTIONS } from '@/lib/collections';
import { TYPE_HUBS } from '@/lib/hubs';
import { FEATURE_TYPE_COLORS } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Explore caves, waterfalls & hot springs',
  description:
    'Browse the atlas by feature and region — waterfalls, caves, hot springs, and springs across 16 US states, with maps, difficulty ratings, and community-reported conditions.',
  alternates: { canonical: '/explore' },
};

export default function ExplorePage() {
  return (
    <div className="mx-auto w-full max-w-content px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Reveal>
        <header className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <Icon name="compass" size={13} weight="fill" />
            Field guide
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] text-stone-50 sm:text-5xl">
            Explore the atlas
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-400">
            Start with what you want to find. Each guide breaks the atlas down by feature and by
            state — real coordinates, difficulty ratings, and conditions reported by people who have
            actually been there.
          </p>
        </header>
      </Reveal>

      <Reveal className="mt-10 sm:mt-12">
        <nav aria-label="Feature guides">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TYPE_HUBS.map((hub) => {
              const color = FEATURE_TYPE_COLORS[hub.feature];
              return (
                <li key={hub.slug}>
                  <Link
                    href={`/explore/${hub.slug}`}
                    className={cardClass({
                      hover: true,
                      className:
                        'group flex h-full flex-col p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-6',
                    })}
                  >
                    <span className="flex items-center gap-3.5">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-white/5 transition-transform duration-200 ease-spring group-hover:scale-105"
                        style={{ backgroundColor: `${color}1f`, color }}
                      >
                        <Icon name={hub.feature} size={24} weight="fill" />
                      </span>
                      <span className="font-display text-xl font-semibold text-stone-50">
                        {hub.plural}
                      </span>
                    </span>
                    <span className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-400">
                      {hub.intro}
                    </span>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                      Browse {hub.plural.toLowerCase()}
                      <Icon
                        name="directions"
                        size={14}
                        className="-rotate-90 transition-transform duration-200 ease-spring group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </Reveal>

      <Reveal className="mt-14">
        <section aria-label="Curated collections">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Editor's picks"
              title="Curated collections"
            />
            <Link
              href="/collections"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              See all
              <Icon name="directions" size={14} className="-rotate-90" />
            </Link>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
            Hand-picked lenses onto the map — grouped by season, difficulty, and character.
          </p>
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COLLECTIONS.slice(0, 3).map((collection) => (
              <li key={collection.slug}>
                <CollectionCard collection={collection} />
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal className="mt-14">
        <section
          aria-label="Other ways to browse"
          className="rounded-3xl bg-surface-raised hairline p-6 sm:p-8"
        >
          <SectionHeading eyebrow="Other ways to browse" title="Prefer the whole picture?" />
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
            Open the live map to see every spot at once, or search and filter the full list by name,
            type, and difficulty.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/" className={buttonClass({ variant: 'primary' })}>
              <Icon name="map" size={18} />
              Browse the map
            </Link>
            <Link href="/spots" className={buttonClass({ variant: 'secondary' })}>
              <Icon name="list" size={18} />
              Search all spots
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
