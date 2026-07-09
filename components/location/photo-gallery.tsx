import type { LocationMedia } from '@/lib/types';

/**
 * Horizontal, swipeable strip of location photos. `name` (optional) is used for
 * descriptive alt text; when absent a generic alt is used.
 */
export function PhotoGallery({ media, name }: { media: LocationMedia[]; name?: string }) {
  if (media.length === 0) return null;

  return (
    <section aria-label="Photos">
      <ul className="flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {media.map((m) => (
          <li
            key={m.id}
            className="relative shrink-0 overflow-hidden rounded-2xl ring-1 ring-inset ring-white/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote user media, no fixed dimensions */}
            <img
              src={m.url}
              alt={name ?? 'Location photo'}
              loading="lazy"
              className="h-48 w-72 max-w-[80vw] object-cover transition-transform duration-500 ease-spring hover:scale-[1.03] sm:h-56 sm:w-80"
            />
            {m.credit && (
              <span className="absolute bottom-2 right-2 max-w-[85%] truncate rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-stone-200 backdrop-blur">
                {m.credit}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
