import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icon';
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
    <div className="mx-auto w-full max-w-shell px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-100">Explore</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-400">
          Start with what you want to find. Each guide breaks the atlas down by feature and by
          state, with real coordinates, difficulty ratings, and conditions reported by people who
          have been there.
        </p>
      </header>

      <nav aria-label="Feature guides" className="mt-6">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TYPE_HUBS.map((hub) => {
            const color = FEATURE_TYPE_COLORS[hub.feature];
            return (
              <li key={hub.slug}>
                <Link
                  href={`/explore/${hub.slug}`}
                  className="flex h-full flex-col rounded-xl border border-stone-800 bg-surface-raised p-4 transition-colors hover:border-stone-700 hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}22`, color }}
                    >
                      <Icon name={hub.feature} size={22} weight="fill" />
                    </span>
                    <span className="text-lg font-medium text-stone-100">{hub.plural}</span>
                  </span>
                  <span className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-400">
                    {hub.intro}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                    Browse {hub.plural.toLowerCase()}
                    <Icon name="compass" size={15} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-label="Other ways to browse" className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Other ways to browse
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-700 px-4 text-sm font-medium text-stone-200 transition-colors hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="map" size={18} />
            Browse the map
          </Link>
          <Link
            href="/spots"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-700 px-4 text-sm font-medium text-stone-200 transition-colors hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="list" size={18} />
            Search all spots
          </Link>
        </div>
      </section>
    </div>
  );
}
