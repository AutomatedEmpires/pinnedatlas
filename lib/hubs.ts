// Shared vocabulary for the /explore programmatic-SEO hubs. Pure data + string
// helpers only (no DB, no server-only imports) so it can be consumed by server
// pages and the sitemap alike. URL type slugs are plural + hyphenated; state
// slugs are the lowercase, hyphenated full state name (e.g. "new-mexico").

import type { FeatureType } from '@/lib/types';

/** The four real, browseable feature types — everything except 'other'. */
export type HubFeature = Exclude<FeatureType, 'other'>;

export interface TypeHub {
  /** URL slug, plural + hyphenated (e.g. "hot-springs"). */
  slug: string;
  feature: HubFeature;
  /** Singular label (e.g. "Hot Spring"). */
  label: string;
  /** Plural, title-cased for headings (e.g. "Hot Springs"). */
  plural: string;
  /** 2–3 sentences of honest, safety-minded editorial copy. */
  intro: string;
}

/**
 * Ordered type hubs. `intro` copy is deliberately plain and safety-aware — it
 * describes what the feature is, why it's worth seeking, and how to stay safe,
 * without inventing specific facts or counts.
 */
export const TYPE_HUBS: TypeHub[] = [
  {
    slug: 'waterfalls',
    feature: 'waterfall',
    label: 'Waterfall',
    plural: 'Waterfalls',
    intro:
      'Waterfalls are where a river meets a sudden drop — from roadside cascades to backcountry plunges that reward a long hike. Flow swings hard with the seasons, peaking with snowmelt and spring rain and thinning to a trickle by late summer. Wet rock near the lip and base stays slick and unforgiving, so keep well back from edges and never wade above a drop.',
  },
  {
    slug: 'caves',
    feature: 'cave',
    label: 'Cave',
    plural: 'Caves',
    intro:
      'Caves range from walk-in grottoes to technical systems that demand ropes, redundant light, and real experience. They hold a steady, cool temperature year-round and a darkness that is absolute once you are past the entrance. Never go alone or without backup light, tell someone your plan, and respect gates and closures — many protect fragile formations or hibernating bats.',
  },
  {
    slug: 'hot-springs',
    feature: 'hot_spring',
    label: 'Hot Spring',
    plural: 'Hot Springs',
    intro:
      'Hot springs are geothermally heated pools where warm groundwater surfaces — some developed and soakable, others wild and unpredictable. Temperatures range from pleasant to scalding and can shift without warning, so test the water carefully before getting in. Check current access and ownership first, since some sit on private or protected land and conditions change with weather and runoff.',
  },
  {
    slug: 'springs',
    feature: 'spring',
    label: 'Spring',
    plural: 'Springs',
    intro:
      'Springs are points where groundwater flows naturally to the surface, feeding creeks, wetlands, and desert oases that draw wildlife for miles. Many are cold, clear, and quietly beautiful, but untreated water is not automatically safe to drink — filter or treat it first. Tread lightly around the source; these are fragile habitats and often the only water for miles.',
  },
];

/** Type slug → feature (4 real types; 'other' is intentionally excluded). */
export const TYPE_SLUG_TO_FEATURE: Record<string, HubFeature> = Object.fromEntries(
  TYPE_HUBS.map((h) => [h.slug, h.feature]),
);

/** Feature → type slug (4 real types; 'other' is intentionally excluded). */
export const FEATURE_TO_TYPE_SLUG: Record<HubFeature, string> = Object.fromEntries(
  TYPE_HUBS.map((h) => [h.feature, h.slug]),
) as Record<HubFeature, string>;

// Single source of truth for all 50 states + DC, in display order.
const STATES: { name: string; code: string }[] = [
  { name: 'Alabama', code: 'AL' },
  { name: 'Alaska', code: 'AK' },
  { name: 'Arizona', code: 'AZ' },
  { name: 'Arkansas', code: 'AR' },
  { name: 'California', code: 'CA' },
  { name: 'Colorado', code: 'CO' },
  { name: 'Connecticut', code: 'CT' },
  { name: 'Delaware', code: 'DE' },
  { name: 'Florida', code: 'FL' },
  { name: 'Georgia', code: 'GA' },
  { name: 'Hawaii', code: 'HI' },
  { name: 'Idaho', code: 'ID' },
  { name: 'Illinois', code: 'IL' },
  { name: 'Indiana', code: 'IN' },
  { name: 'Iowa', code: 'IA' },
  { name: 'Kansas', code: 'KS' },
  { name: 'Kentucky', code: 'KY' },
  { name: 'Louisiana', code: 'LA' },
  { name: 'Maine', code: 'ME' },
  { name: 'Maryland', code: 'MD' },
  { name: 'Massachusetts', code: 'MA' },
  { name: 'Michigan', code: 'MI' },
  { name: 'Minnesota', code: 'MN' },
  { name: 'Mississippi', code: 'MS' },
  { name: 'Missouri', code: 'MO' },
  { name: 'Montana', code: 'MT' },
  { name: 'Nebraska', code: 'NE' },
  { name: 'Nevada', code: 'NV' },
  { name: 'New Hampshire', code: 'NH' },
  { name: 'New Jersey', code: 'NJ' },
  { name: 'New Mexico', code: 'NM' },
  { name: 'New York', code: 'NY' },
  { name: 'North Carolina', code: 'NC' },
  { name: 'North Dakota', code: 'ND' },
  { name: 'Ohio', code: 'OH' },
  { name: 'Oklahoma', code: 'OK' },
  { name: 'Oregon', code: 'OR' },
  { name: 'Pennsylvania', code: 'PA' },
  { name: 'Rhode Island', code: 'RI' },
  { name: 'South Carolina', code: 'SC' },
  { name: 'South Dakota', code: 'SD' },
  { name: 'Tennessee', code: 'TN' },
  { name: 'Texas', code: 'TX' },
  { name: 'Utah', code: 'UT' },
  { name: 'Vermont', code: 'VT' },
  { name: 'Virginia', code: 'VA' },
  { name: 'Washington', code: 'WA' },
  { name: 'West Virginia', code: 'WV' },
  { name: 'Wisconsin', code: 'WI' },
  { name: 'Wyoming', code: 'WY' },
];

/** Lowercase state name → 2-letter code (e.g. "new mexico" → "NM"). */
export const STATE_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  STATES.map((s) => [s.name.toLowerCase(), s.code]),
);

/** 2-letter code → display state name (e.g. "NM" → "New Mexico"). */
export const CODE_TO_STATE_NAME: Record<string, string> = Object.fromEntries(
  STATES.map((s) => [s.code, s.name]),
);

/** The 16 states with data in the atlas. */
export const COVERED_STATES: string[] = [
  'WA',
  'OR',
  'CA',
  'ID',
  'NV',
  'UT',
  'AZ',
  'MT',
  'WY',
  'CO',
  'NM',
  'TX',
  'AR',
  'MO',
  'TN',
  'NC',
];

/** Resolve a type slug to its FeatureType, or null if it is not a real hub. */
export function typeForSlug(slug: string): FeatureType | null {
  return TYPE_SLUG_TO_FEATURE[slug] ?? null;
}

/** Resolve a FeatureType to its type slug, or null for 'other'. */
export function slugForType(feature: FeatureType): string | null {
  return FEATURE_TO_TYPE_SLUG[feature as HubFeature] ?? null;
}

/** Look up the full hub record for a type slug, or null if invalid. */
export function hubForSlug(slug: string): TypeHub | null {
  return TYPE_HUBS.find((h) => h.slug === slug) ?? null;
}

/** Resolve a state slug (hyphenated lowercase name) to its 2-letter code. */
export function stateSlugToCode(slug: string): string | null {
  const name = slug.toLowerCase().replace(/-/g, ' ');
  return STATE_NAME_TO_CODE[name] ?? null;
}

/** Convert a 2-letter code to its URL state slug (e.g. "NM" → "new-mexico"). */
export function codeToStateSlug(code: string): string {
  const name = CODE_TO_STATE_NAME[code.toUpperCase()];
  return name ? name.toLowerCase().replace(/\s+/g, '-') : '';
}

/**
 * Every hub URL path, for the sitemap: '/explore', each type hub, and every
 * covered-state page for all four types. The orchestrator wires this in.
 */
export function hubPaths(): string[] {
  const paths: string[] = ['/explore'];
  for (const hub of TYPE_HUBS) {
    paths.push(`/explore/${hub.slug}`);
    for (const code of COVERED_STATES) {
      paths.push(`/explore/${hub.slug}/${codeToStateSlug(code)}`);
    }
  }
  return paths;
}
