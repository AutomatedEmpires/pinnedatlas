import 'server-only';
import { getSubscription } from '@/lib/db/subscriptions';
import type { SubscriptionRecord } from '@/lib/types';

export const FREE_SAVE_LIMIT = 10;

export interface Entitlement {
  plan: 'free' | 'monthly' | 'annual' | 'lifetime';
  isPremium: boolean;
  /** null = unlimited */
  saveLimit: number | null;
}

export const FREE_ENTITLEMENT: Entitlement = {
  plan: 'free',
  isPremium: false,
  saveLimit: FREE_SAVE_LIMIT,
};

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'lifetime']);

/** Pure derivation so it is unit-testable without a database. */
export function deriveEntitlement(sub: SubscriptionRecord | null): Entitlement {
  if (!sub) return FREE_ENTITLEMENT;
  if (sub.plan === 'lifetime') {
    return { plan: 'lifetime', isPremium: true, saveLimit: null };
  }
  if ((sub.plan === 'monthly' || sub.plan === 'annual') && ACTIVE_STATUSES.has(sub.status)) {
    return { plan: sub.plan, isPremium: true, saveLimit: null };
  }
  return FREE_ENTITLEMENT;
}

/**
 * Server-side entitlement check. This — synced from Stripe webhooks into the
 * `subscription` table — is the only source of truth for premium gating.
 * Never gate on client state.
 */
export async function getEntitlement(userId: string | null): Promise<Entitlement> {
  if (!userId) return FREE_ENTITLEMENT;
  const sub = await getSubscription(userId);
  return deriveEntitlement(sub);
}
