import 'server-only';
import { getServiceClient } from '@/lib/db/client';
import type {
  AccessType,
  DifficultyTier,
  FeatureType,
  LocationRecord,
  LocationReport,
} from '@/lib/types';

export interface LocationFilters {
  types?: FeatureType[];
  difficulties?: DifficultyTier[];
  verifiedOnly?: boolean;
  state?: string;
  q?: string;
  bbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number };
  limit?: number;
}

const PUBLIC_STATUSES = ['verified', 'community'];

function applyFilters(query: any, filters: LocationFilters) {
  let q = query.in('moderation_status', filters.verifiedOnly ? ['verified'] : PUBLIC_STATUSES);
  if (filters.types?.length) q = q.in('feature_type', filters.types);
  if (filters.difficulties?.length) q = q.in('difficulty_tier', filters.difficulties);
  if (filters.state) q = q.eq('state_code', filters.state.toUpperCase());
  if (filters.q) q = q.ilike('name', `%${filters.q}%`);
  if (filters.bbox) {
    q = q
      .gte('lat', filters.bbox.minLat)
      .lte('lat', filters.bbox.maxLat)
      .gte('lng', filters.bbox.minLng)
      .lte('lng', filters.bbox.maxLng);
  }
  return q;
}

export async function listLocations(filters: LocationFilters = {}): Promise<LocationRecord[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data, error } = await applyFilters(db.from('location').select('*'), filters)
    .order('name')
    .limit(filters.limit ?? 5000);
  if (error) throw new Error(`listLocations: ${error.message}`);
  return (data ?? []) as LocationRecord[];
}

export async function getLocationBySlug(slug: string): Promise<LocationRecord | null> {
  const db = getServiceClient();
  if (!db) return null;
  const { data, error } = await db
    .from('location')
    .select('*')
    .eq('slug', slug)
    .in('moderation_status', PUBLIC_STATUSES)
    .maybeSingle();
  if (error) throw new Error(`getLocationBySlug: ${error.message}`);
  return (data as LocationRecord) ?? null;
}

export async function locationsNear(
  lat: number,
  lng: number,
  radiusM: number,
  limit = 50,
): Promise<(LocationRecord & { distance_m: number })[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data, error } = await db.rpc('locations_near', {
    p_lat: lat,
    p_lng: lng,
    p_radius_m: radiusM,
    p_limit: limit,
  });
  if (error) throw new Error(`locationsNear: ${error.message}`);
  return (data ?? []) as (LocationRecord & { distance_m: number })[];
}

export interface NewSubmission {
  name: string;
  feature_type: FeatureType;
  lat: number;
  lng: number;
  description: string | null;
  difficulty_tier: DifficultyTier;
  access_type: AccessType;
  hazard_notes: string | null;
  slug: string;
  submitted_by: string;
}

export async function insertSubmission(input: NewSubmission): Promise<LocationRecord> {
  const db = getServiceClient();
  if (!db) throw new Error('Database not configured');
  const { data, error } = await db
    .from('location')
    .insert({
      ...input,
      source: 'user_submitted',
      moderation_status: 'pending',
    })
    .select('*')
    .single();
  if (error) throw new Error(`insertSubmission: ${error.message}`);
  return data as LocationRecord;
}

export async function listPendingLocations(): Promise<LocationRecord[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data, error } = await db
    .from('location')
    .select('*')
    .eq('moderation_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw new Error(`listPendingLocations: ${error.message}`);
  return (data ?? []) as LocationRecord[];
}

export async function moderateLocation(
  id: string,
  action: 'approve' | 'verify' | 'reject',
): Promise<void> {
  const db = getServiceClient();
  if (!db) throw new Error('Database not configured');
  const status = action === 'reject' ? 'rejected' : action === 'verify' ? 'verified' : 'community';
  const { error } = await db.from('location').update({ moderation_status: status }).eq('id', id);
  if (error) throw new Error(`moderateLocation: ${error.message}`);
}

/** Latest public reports per location, used for freshness display on cards/detail. */
export async function listReportsForLocation(locationId: string, limit = 20): Promise<LocationReport[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data, error } = await db
    .from('location_report')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listReportsForLocation: ${error.message}`);
  return (data ?? []) as LocationReport[];
}
