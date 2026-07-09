// Curated "Collections" — hand-picked lenses onto the atlas. These are pure
// data + string helpers (no DB, no server-only imports) so the sitemap and
// server pages can both consume them. Each collection is nothing more than an
// editorial framing plus an honest filter over listLocations — no fabricated
// facts, counts, or places. The pages resolve the real spots at request time.

import type { DifficultyTier, FeatureType } from '@/lib/types';
import type { IconName } from '@/components/icon';

/** Badge/icon tone accepted by badgeClass — kept in sync with components/ui. */
export type CollectionTone =
  | 'neutral'
  | 'accent'
  | 'topaz'
  | 'amber'
  | 'violet'
  | 'sky'
  | 'rose'
  | 'teal';

/** The subset of LocationFilters a collection is allowed to express. */
export interface CollectionFilter {
  types?: FeatureType[];
  difficulties?: DifficultyTier[];
  verifiedOnly?: boolean;
}

export interface Collection {
  /** URL slug (e.g. "roadside-wonders"). */
  slug: string;
  /** Editorial title (rendered in the display serif). */
  title: string;
  /** One-line framing shown under the title. */
  subtitle: string;
  /** 1–2 sentences of honest editorial voice — no invented specifics. */
  blurb: string;
  /** Semantic icon name (see components/icon). */
  icon: IconName;
  /** Visual tone for the icon chip + badge. */
  tone: CollectionTone;
  /** Pure filter over the atlas — the collection's only claim to truth. */
  filter: CollectionFilter;
}

/**
 * Six curated collections. Order is intentional: it opens approachable, moves
 * through the seasonal and elemental, and ends on the two "trust" lenses
 * (bold routes and verified spots).
 */
export const COLLECTIONS: Collection[] = [
  {
    slug: 'roadside-wonders',
    title: 'Roadside Wonders',
    subtitle: 'Big payoff, short walk',
    blurb:
      'Easy-rated spots you can reach without a technical approach. The right list for a spontaneous detour, a slow morning, or a day out with everyone in tow.',
    icon: 'directions',
    tone: 'topaz',
    filter: { difficulties: ['easy'] },
  },
  {
    slug: 'waterfall-season',
    title: 'Waterfall Season',
    subtitle: 'Chase the meltwater',
    blurb:
      'Snowmelt and spring rain send falls to their fullest. Time your visit for peak flow — and keep well back from the slick rock at the lip and base.',
    icon: 'waterfall',
    tone: 'sky',
    filter: { types: ['waterfall'] },
  },
  {
    slug: 'winter-hot-springs',
    title: 'Winter Hot Springs',
    subtitle: 'Warm water, cold air',
    blurb:
      'There is nothing like sinking into a warm soak while the air bites. Wild and developed springs alike — always test the temperature before you get in.',
    icon: 'hot_spring',
    tone: 'rose',
    filter: { types: ['hot_spring'] },
  },
  {
    slug: 'into-the-dark',
    title: 'Into the Dark',
    subtitle: 'Beyond the entrance',
    blurb:
      'Cool, quiet, and absolute once you are past the light. From walk-in grottoes to serious systems — never go without backup light and a plan you have shared.',
    icon: 'cave',
    tone: 'violet',
    filter: { types: ['cave'] },
  },
  {
    slug: 'for-the-bold',
    title: 'For the Bold',
    subtitle: 'Earn the view',
    blurb:
      'Hard and technical routes for those with the skills and gear to match. Scout current conditions, carry redundancy, and turn back when the terrain says so.',
    icon: 'warning',
    tone: 'amber',
    filter: { difficulties: ['hard', 'technical'] },
  },
  {
    slug: 'verified-gems',
    title: 'Verified Gems',
    subtitle: 'Coordinates you can trust',
    blurb:
      'The spots our team has reviewed and confirmed. A dependable starting point when you want to plan around locations you can count on.',
    icon: 'verified',
    tone: 'accent',
    filter: { verifiedOnly: true },
  },
];

/** Look up a collection by slug, or null if it is not a real collection. */
export function getCollection(slug: string): Collection | null {
  return COLLECTIONS.find((c) => c.slug === slug) ?? null;
}

/**
 * Every collection URL path, for the sitemap: '/collections' plus each
 * '/collections/{slug}'. The orchestrator wires this in.
 */
export function collectionPaths(): string[] {
  return ['/collections', ...COLLECTIONS.map((c) => `/collections/${c.slug}`)];
}
