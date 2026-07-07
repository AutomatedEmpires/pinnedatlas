import 'server-only';
import { getServiceClient } from '@/lib/db/client';
import type { SubscriptionRecord } from '@/lib/types';

export async function getSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const db = getServiceClient();
  if (!db) return null;
  const { data, error } = await db
    .from('subscription')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`getSubscription: ${error.message}`);
  return (data as SubscriptionRecord) ?? null;
}

export async function upsertSubscription(
  record: Omit<SubscriptionRecord, 'updated_at'>,
): Promise<void> {
  const db = getServiceClient();
  if (!db) throw new Error('Database not configured');
  const { error } = await db
    .from('subscription')
    .upsert({ ...record, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw new Error(`upsertSubscription: ${error.message}`);
}

export async function findUserIdByCustomer(stripeCustomerId: string): Promise<string | null> {
  const db = getServiceClient();
  if (!db) return null;
  const { data, error } = await db
    .from('subscription')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  if (error) throw new Error(`findUserIdByCustomer: ${error.message}`);
  return data?.user_id ?? null;
}
