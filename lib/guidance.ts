// Derived trip intelligence. These are honest, general expectations computed
// from a location's feature type, difficulty, elevation, and geography — NOT
// fabricated per-location facts. The UI labels them as general guidance so
// users understand what is verified data vs. what is typical for the type.

import type { AccessType, DifficultyTier, FeatureType, LocationRecord } from '@/lib/types';

export interface Guidance {
  /** One-line plain-language summary of what this place is. */
  summary: string;
  /** A short paragraph on what a visit is typically like. */
  whatToExpect: string;
  bestTime: { label: string; detail: string };
  effort: { label: string; detail: string };
  bring: string[];
  goodToKnow: string[];
  safety: string[];
}

const EFFORT: Record<DifficultyTier, { label: string; detail: string }> = {
  easy: {
    label: 'Easy access',
    detail:
      'Usually a roadside pullout or a short, gentle path — often under a mile with little elevation change. Good for casual visits and most fitness levels.',
  },
  moderate: {
    label: 'Moderate hike',
    detail:
      'Expect a real walk: roughly 1–3 miles round trip with some elevation gain or uneven footing. Wear proper shoes and give yourself time.',
  },
  hard: {
    label: 'Strenuous',
    detail:
      'A demanding outing — long miles, steep grades, scrambling, or route-finding. Come fit, start early, and carry navigation and extra water.',
  },
  technical: {
    label: 'Technical',
    detail:
      'Specialized skills and gear are required (ropes, wetsuits, or serious caving/canyoning experience). Do not attempt without training or a qualified group.',
  },
};

function bestTime(type: FeatureType, lat: number): { label: string; detail: string } {
  const northern = lat >= 0;
  switch (type) {
    case 'waterfall':
      return {
        label: northern ? 'Late spring (peak flow)' : 'Local wet season (peak flow)',
        detail:
          'Flow is strongest during and just after snowmelt or the rainy season. By late summer many falls slow to a trickle. After heavy rain they roar — but access can be dangerous.',
      };
    case 'hot_spring':
      return {
        label: 'Fall through early spring',
        detail:
          'A hot soak feels best when the air is cool. Summer visits can be uncomfortably hot, and desert springs may be unpleasant midday. Early morning and dusk are quietest.',
      };
    case 'spring':
      return {
        label: 'Spring and fall',
        detail:
          'Mild shoulder seasons offer the best footing and steadiest flow. Spring runoff can make surrounding ground muddy; late summer flow may drop.',
      };
    case 'cave':
      return {
        label: 'Year-round (stable temps)',
        detail:
          'Caves hold a near-constant cool temperature all year. Watch for seasonal closures that protect hibernating bats, and avoid entry after heavy rain when passages can flood.',
      };
    default:
      return {
        label: 'Spring and fall',
        detail: 'Shoulder seasons usually offer the most comfortable conditions and best footing.',
      };
  }
}

function whatToExpect(type: FeatureType, difficulty: DifficultyTier): string {
  const base: Record<FeatureType, string> = {
    waterfall:
      'A cascade where water drops over rock. The payoff is the falls themselves — mist, sound, and often a pool below. Rocks near the water stay slick, and the best viewpoints can require care to reach.',
    hot_spring:
      'A natural source of geothermally heated water. Some are developed with soaking pools; many are primitive and undeveloped. Temperature, depth, and soak-ability vary widely — and are rarely regulated.',
    spring:
      'A point where groundwater surfaces naturally. Expect a quiet, often lush spot; some feed clear pools or small streams. The water is untreated and not automatically safe to drink.',
    cave:
      'An opening into an underground passage. Beyond the entrance it is completely dark, cooler, and can be disorienting. Depth and difficulty range from a short walk-in to serious technical caving.',
    other:
      'A natural geological feature worth seeking out. Conditions and access vary — read the details and any recent reports before you go.',
  };
  const closer =
    difficulty === 'easy'
      ? ' Reaching it is straightforward.'
      : difficulty === 'technical'
        ? ' Reaching it safely takes real skill and equipment.'
        : ' Plan for a genuine outdoor outing to reach it.';
  return base[type] + closer;
}

function bringList(type: FeatureType, difficulty: DifficultyTier): string[] {
  const items = [
    'Plenty of water',
    'Sturdy, closed-toe footwear',
    'Offline map or downloaded directions (signal is often weak)',
    'Tell someone your plan and expected return time',
  ];
  if (type === 'waterfall') items.push('Shoes with grip — wet rock is slippery', 'Dry bag for electronics', 'Swimwear if you plan to get in');
  if (type === 'hot_spring') items.push('Towel and easy-off sandals', 'No glass containers', 'Extra drinking water — soaking dehydrates you');
  if (type === 'cave') items.push('Three independent light sources', 'Helmet and a warm layer', 'Confirm the entrance is open (bat/season closures)');
  if (type === 'spring') items.push('A way to filter or purify water if you intend to drink');
  if (difficulty === 'hard' || difficulty === 'technical')
    items.push('Navigation (GPS + backup)', 'First-aid basics and extra daylight', 'Appropriate technical gear');
  return items;
}

function goodToKnow(loc: LocationRecord): string[] {
  const out: string[] = [];
  const access: Record<AccessType, string> = {
    public_land: 'Appears to sit on public land, but boundaries change — respect posted signs and closures.',
    private_land_permission_required:
      'May cross or sit on private land. Do not trespass; seek permission or a legal access route.',
    unclear: 'Access status is unclear. Verify you have a legal right to be here before you go.',
  };
  out.push(access[loc.access_type]);
  if (loc.moderation_status === 'community')
    out.push('Community-sourced from open map data — confirm the specifics before relying on them.');
  if (loc.difficulty_tier === 'hard' || loc.difficulty_tier === 'technical')
    out.push('Cell coverage is often unreliable here — download everything you need in advance.');
  out.push('Conditions change fast in the outdoors. Check the latest reports below before heading out.');
  return out;
}

function safetyList(type: FeatureType, difficulty: DifficultyTier): string[] {
  const byType: Record<FeatureType, string[]> = {
    waterfall: [
      'Rock near falls is slick with spray and algae — a single slip can be fatal.',
      'Currents above and below a falls are stronger than they look; never wade near the lip.',
      'Cold water can cause gasp reflex and shock even on hot days.',
    ],
    hot_spring: [
      'Water temperature varies and can scald — test carefully before entering.',
      'Never submerge your head: rare but serious waterborne organisms live in warm water.',
      'Undeveloped springs have no lifeguards, depth markers, or temperature controls.',
    ],
    spring: [
      'Untreated spring water is not automatically safe to drink — filter or purify.',
      'Ground around a source is often muddy, slick, and unstable.',
    ],
    cave: [
      'Total darkness and complex passages make disorientation easy — never go alone.',
      'Loose rock, drops, and low ceilings cause most cave injuries.',
      'Caves are cold; hypothermia is a real risk even in summer.',
      'Flooding can occur fast after rain — check the forecast.',
    ],
    other: ['Assess terrain and conditions before committing, and turn back if anything feels wrong.'],
  };
  const list = [...byType[type]];
  if (difficulty === 'hard' || difficulty === 'technical')
    list.push('The route itself is a hazard — exposure, length, and terrain demand experience and the right gear.');
  return list;
}

export function getGuidance(loc: LocationRecord): Guidance {
  return {
    summary: whatToExpect(loc.feature_type, loc.difficulty_tier).split('.')[0] + '.',
    whatToExpect: whatToExpect(loc.feature_type, loc.difficulty_tier),
    bestTime: bestTime(loc.feature_type, loc.lat),
    effort: EFFORT[loc.difficulty_tier],
    bring: bringList(loc.feature_type, loc.difficulty_tier),
    goodToKnow: goodToKnow(loc),
    safety: safetyList(loc.feature_type, loc.difficulty_tier),
  };
}
