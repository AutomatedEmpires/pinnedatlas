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
          <li key={m.id} className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote user media, no fixed dimensions */}
            <img
              src={m.url}
              alt={name ? `${name}` : 'Location photo'}
              loading="lazy"
              className="h-[180px] w-[260px] max-w-[80vw] rounded-xl object-cover"
            />
            {m.credit && (
              <span className="absolute bottom-1.5 right-1.5 max-w-[85%] truncate rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-stone-200 backdrop-blur">
                {m.credit}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
