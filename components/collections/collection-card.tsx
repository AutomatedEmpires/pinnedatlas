import Link from 'next/link';
import { Icon } from '@/components/icon';
import { cardClass, cn } from '@/components/ui';
import type { Collection, CollectionTone } from '@/lib/collections';

// Tinted icon-chip classes per tone — a larger echo of the badge tones in
// components/ui (which are private to that module).
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

const ARROW_TONE: Record<CollectionTone, string> = {
  neutral: 'group-hover:text-stone-200',
  accent: 'group-hover:text-accent',
  topaz: 'group-hover:text-topaz',
  amber: 'group-hover:text-amber-300',
  violet: 'group-hover:text-violet-300',
  sky: 'group-hover:text-sky-300',
  rose: 'group-hover:text-rose-300',
  teal: 'group-hover:text-teal-300',
};

/** A curated-collection card that links to its detail page. */
export function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className={cardClass({
        hover: true,
        className:
          'group flex h-full flex-col p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
      })}
    >
      <span
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset transition-transform duration-200 ease-spring group-hover:scale-105',
          CHIP_TONE[collection.tone],
        )}
      >
        <Icon name={collection.icon} size={24} weight="fill" />
      </span>

      <span className="mt-4 block font-display text-lg font-semibold text-stone-50">
        {collection.title}
      </span>
      <span className="mt-0.5 block text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
        {collection.subtitle}
      </span>
      <span className="mt-2 block text-sm leading-relaxed text-stone-400">{collection.blurb}</span>

      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-stone-300 transition-colors">
        <span className={cn('transition-colors', ARROW_TONE[collection.tone])}>Open collection</span>
        <Icon
          name="directions"
          size={14}
          className={cn(
            '-rotate-90 text-stone-600 transition-transform duration-200 ease-spring group-hover:translate-x-0.5',
            ARROW_TONE[collection.tone],
          )}
        />
      </span>
    </Link>
  );
}
