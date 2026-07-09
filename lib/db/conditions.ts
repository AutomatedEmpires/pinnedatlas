import 'server-only';
import { getServiceClient } from '@/lib/db/client';
import type { FeatureType } from '@/lib/types';

export interface ConditionSpot {
  id: string;
  slug: string;
  lat: number;
  lng: number;
  feature_type: FeatureType;
}

export interface StoredConditions {
  score: number;
  verdict: string;
  flowPct: number | null;
  headline: string;
}

// Only these types get scored — the ones where "right now" genuinely varies.
const SCORED_TYPES: FeatureType[] = ['waterfall', 'hot_spring'];

/** Stalest conditions-relevant public spots, oldest (or never-computed) first. */
export async function getStaleConditionSpots(limit: number): Promise<ConditionSpot[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data, error } = await db
    .from('location')
    .select('id, slug, lat, lng, feature_type')
    .in('feature_type', SCORED_TYPES)
    .in('moderation_status', ['verified', 'community'])
    .order('condition_updated_at', { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw new Error(`getStaleConditionSpots: ${error.message}`);
  return (data ?? []) as ConditionSpot[];
}

/** Mark a spot as checked without a score (e.g. weather was unreachable) so it
 * rotates out of the "stalest" queue instead of blocking it. */
export async function touchConditions(id: string): Promise<void> {
  const db = getServiceClient();
  if (!db) return;
  await db.from('location').update({ condition_updated_at: new Date().toISOString() }).eq('id', id);
}

export interface ConditionsLeader {
  slug: string;
  name: string;
  feature_type: FeatureType;
  lat: number;
  lng: number;
  state_code: string | null;
  condition_score: number;
  condition_verdict: string;
  condition_flow_pct: number | null;
  condition_headline: string | null;
}

/**
 * Highest-scoring spots right now (for "Flowing right now" discovery). Optionally
 * filtered to a feature type; ordered by Go Score.
 */
export async function listTopConditions(opts?: {
  types?: FeatureType[];
  limit?: number;
}): Promise<ConditionsLeader[]> {
  const db = getServiceClient();
  if (!db) return [];
  let q = db
    .from('location')
    .select(
      'slug,name,feature_type,lat,lng,state_code,condition_score,condition_verdict,condition_flow_pct,condition_headline',
    )
    .in('moderation_status', ['verified', 'community'])
    .not('condition_score', 'is', null)
    .order('condition_score', { ascending: false })
    .limit(opts?.limit ?? 12);
  if (opts?.types?.length) q = q.in('feature_type', opts.types);
  const { data, error } = await q;
  if (error) throw new Error(`listTopConditions: ${error.message}`);
  return (data ?? []) as ConditionsLeader[];
}

export async function writeConditions(id: string, c: StoredConditions): Promise<void> {
  const db = getServiceClient();
  if (!db) return;
  const { error } = await db
    .from('location')
    .update({
      condition_score: c.score,
      condition_verdict: c.verdict,
      condition_flow_pct: c.flowPct,
      condition_headline: c.headline,
      condition_updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(`writeConditions: ${error.message}`);
}
