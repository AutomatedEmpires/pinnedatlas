import 'server-only';
import { getServiceClient } from '@/lib/db/client';
import type { LocationRecord, UserLocationState } from '@/lib/types';

export async function getStatesForUser(
  userId: string,
  locationIds?: string[],
): Promise<UserLocationState[]> {
  const db = getServiceClient();
  if (!db) return [];
  let q = db.from('user_location_state').select('*').eq('user_id', userId);
  if (locationIds?.length) q = q.in('location_id', locationIds);
  const { data, error } = await q;
  if (error) throw new Error(`getStatesForUser: ${error.message}`);
  return (data ?? []) as UserLocationState[];
}

export async function countSaves(userId: string): Promise<number> {
  const db = getServiceClient();
  if (!db) return 0;
  const { count, error } = await db
    .from('user_location_state')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('saved', true);
  if (error) throw new Error(`countSaves: ${error.message}`);
  return count ?? 0;
}

export async function upsertState(
  userId: string,
  locationId: string,
  patch: Partial<Pick<UserLocationState, 'saved' | 'visited' | 'personal_note'>>,
): Promise<UserLocationState> {
  const db = getServiceClient();
  if (!db) throw new Error('Database not configured');
  const { data, error } = await db
    .from('user_location_state')
    .upsert(
      { user_id: userId, location_id: locationId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,location_id' },
    )
    .select('*')
    .single();
  if (error) throw new Error(`upsertState: ${error.message}`);
  return data as UserLocationState;
}

export interface SavedLocation extends UserLocationState {
  location: LocationRecord;
}

export async function getSavedLocations(userId: string): Promise<SavedLocation[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data, error } = await db
    .from('user_location_state')
    .select('*, location:location_id(*)')
    .eq('user_id', userId)
    .or('saved.eq.true,visited.eq.true')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`getSavedLocations: ${error.message}`);
  return ((data ?? []) as unknown as SavedLocation[]).filter((row) => row.location);
}
