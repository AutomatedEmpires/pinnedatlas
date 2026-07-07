// Canonical domain types. One `location` object drives map pin, detail page,
// search, submission, and moderation — never fork parallel location models.

export type FeatureType = 'cave' | 'waterfall' | 'hot_spring' | 'spring' | 'other';
export type DifficultyTier = 'easy' | 'moderate' | 'hard' | 'technical';
export type AccessType = 'public_land' | 'private_land_permission_required' | 'unclear';
export type ModerationStatus = 'verified' | 'community' | 'pending' | 'rejected';
export type SourceType = 'osm' | 'usgs' | 'nps' | 'wikidata' | 'user_submitted';
export type ReportType =
  | 'condition_update'
  | 'closure'
  | 'incorrect_info'
  | 'hazard'
  | 'flowing_status'
  | 'crowd_level';

export interface LocationRecord {
  id: string;
  slug: string;
  name: string;
  feature_type: FeatureType;
  lat: number;
  lng: number;
  elevation_m: number | null;
  description: string | null;
  difficulty_tier: DifficultyTier;
  difficulty_notes: string | null;
  access_type: AccessType;
  season_notes: string | null;
  hazard_notes: string | null;
  source: SourceType;
  source_ref: string | null;
  state_code: string | null;
  moderation_status: ModerationStatus;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationMedia {
  id: string;
  location_id: string;
  url: string;
  credit: string | null;
  uploaded_by: string | null;
  moderation_status: ModerationStatus;
  created_at: string;
}

export interface LocationReport {
  id: string;
  location_id: string;
  user_id: string | null;
  report_type: ReportType;
  body: string;
  created_at: string;
}

export interface UserLocationState {
  user_id: string;
  location_id: string;
  saved: boolean;
  visited: boolean;
  personal_note: string | null;
  updated_at: string;
}

export interface SubscriptionRecord {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  plan: 'monthly' | 'annual' | 'lifetime' | 'none';
  current_period_end: string | null;
  updated_at: string;
}

export const FEATURE_TYPES: FeatureType[] = ['cave', 'waterfall', 'hot_spring', 'spring', 'other'];
export const DIFFICULTY_TIERS: DifficultyTier[] = ['easy', 'moderate', 'hard', 'technical'];
export const REPORT_TYPES: ReportType[] = [
  'condition_update',
  'closure',
  'incorrect_info',
  'hazard',
  'flowing_status',
  'crowd_level',
];

export const FEATURE_TYPE_LABELS: Record<FeatureType, string> = {
  cave: 'Cave',
  waterfall: 'Waterfall',
  hot_spring: 'Hot Spring',
  spring: 'Spring',
  other: 'Other',
};

export const DIFFICULTY_LABELS: Record<DifficultyTier, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
  technical: 'Technical',
};

export const ACCESS_LABELS: Record<AccessType, string> = {
  public_land: 'Public land',
  private_land_permission_required: 'Private land — permission required',
  unclear: 'Access unclear — verify before visiting',
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  condition_update: 'Condition update',
  closure: 'Closure',
  incorrect_info: 'Incorrect info',
  hazard: 'Hazard',
  flowing_status: 'Water flow status',
  crowd_level: 'Crowd level',
};

export const MODERATION_LABELS: Record<ModerationStatus, string> = {
  verified: 'Verified',
  community: 'Community-sourced',
  pending: 'Pending review',
  rejected: 'Rejected',
};

export const SOURCE_LABELS: Record<SourceType, string> = {
  osm: 'OpenStreetMap contributors',
  usgs: 'USGS GNIS',
  nps: 'National Park Service',
  wikidata: 'Wikidata',
  user_submitted: 'Community submission',
};

// Hex colors used for map pins and type badges (kept here so map + UI agree).
export const FEATURE_TYPE_COLORS: Record<FeatureType, string> = {
  cave: '#a78bfa', // violet-400
  waterfall: '#38bdf8', // sky-400
  hot_spring: '#fb7185', // rose-400
  spring: '#2dd4bf', // teal-400
  other: '#a8a29e', // stone-400
};
