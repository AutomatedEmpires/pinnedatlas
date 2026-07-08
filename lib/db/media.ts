import 'server-only';
import { getServiceClient } from '@/lib/db/client';
import type { LocationMedia } from '@/lib/types';

/** Public (verified/community) photos for a location, oldest first. */
export async function listMediaForLocation(locationId: string): Promise<LocationMedia[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data, error } = await db
    .from('location_media')
    .select('*')
    .eq('location_id', locationId)
    .in('moderation_status', ['verified', 'community'])
    .order('created_at', { ascending: true });
  if (error) throw new Error(`listMediaForLocation: ${error.message}`);
  return (data ?? []) as LocationMedia[];
}
