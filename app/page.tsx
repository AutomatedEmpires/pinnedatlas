import { Suspense } from 'react';
import Link from 'next/link';
import { env, hasMapbox, hasSupabase } from '@/lib/env';
import { FEATURE_TYPES, FEATURE_TYPE_LABELS, FEATURE_TYPE_COLORS } from '@/lib/types';
import { Icon } from '@/components/icon';
import { MapView } from '@/components/map-view';
import { MapFilters } from '@/components/map-filters';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const types = typeof sp.types === 'string' ? sp.types : undefined;
  const query = types ? `?types=${encodeURIComponent(types)}` : '';

  if (hasMapbox && hasSupabase) {
    return (
      <div className="relative h-[calc(100dvh-3.5rem)] w-full overflow-hidden">
        <MapView token={env.mapboxToken} geojsonUrl={`/api/locations/geojson${query}`} />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-4">
          <h1 className="pointer-events-auto flex items-center gap-1.5 self-start rounded-full bg-surface/80 px-3 py-1.5 text-base font-semibold tracking-tight backdrop-blur">
            <Icon name="pin" size={18} weight="fill" className="text-accent" />
            PinnedAtlas
          </h1>

          <Link
            href="/spots"
            className="pointer-events-auto flex min-h-11 items-center gap-2 rounded-full bg-surface-raised/90 px-4 text-sm text-stone-400 shadow-lg ring-1 ring-stone-700 backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="search" size={18} />
            Search waterfalls, caves, springs…
          </Link>

          <div className="pointer-events-auto">
            <Suspense fallback={null}>
              <MapFilters />
            </Suspense>
          </div>
        </div>

        <Link
          href="/spots"
          className="absolute bottom-4 right-4 z-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-stone-950 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Icon name="list" size={18} />
          Browse list
        </Link>
      </div>
    );
  }

  // Fallback hero when the map (or its data source) is not configured yet.
  return (
    <div className="mx-auto w-full max-w-shell px-4 py-12">
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Icon name="pin" size={30} weight="fill" className="text-accent" />
            PinnedAtlas
          </h1>
          <p className="text-lg text-stone-300">
            The map of caves, waterfalls, and hot springs worth the hike.
          </p>
          <p className="text-sm text-stone-400">
            The interactive map is coming online. In the meantime, browse every spot as a list.
          </p>
        </header>

        <Link
          href="/spots"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-base font-semibold text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Icon name="list" size={20} />
          Browse all spots
        </Link>

        <section aria-labelledby="explore-by-type" className="flex flex-col gap-3">
          <h2 id="explore-by-type" className="text-sm font-semibold uppercase tracking-wide text-stone-400">
            Explore by type
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {FEATURE_TYPES.map((type) => (
              <Link
                key={type}
                href={`/spots?types=${type}`}
                className="flex min-h-12 items-center gap-2.5 rounded-xl border border-stone-800 bg-surface-raised px-4 py-3 text-sm font-medium text-stone-200 hover:border-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span style={{ color: FEATURE_TYPE_COLORS[type] }}>
                  <Icon name={type} size={20} />
                </span>
                {FEATURE_TYPE_LABELS[type]}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
