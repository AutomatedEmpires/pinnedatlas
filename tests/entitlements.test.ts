import { describe, expect, it } from 'vitest';
import { deriveEntitlement, FREE_SAVE_LIMIT } from '@/lib/billing/entitlements';
import type { SubscriptionRecord } from '@/lib/types';

function sub(overrides: Partial<SubscriptionRecord>): SubscriptionRecord {
  return {
    user_id: 'user_1',
    stripe_customer_id: 'cus_1',
    stripe_subscription_id: 'sub_1',
    status: 'active',
    plan: 'monthly',
    current_period_end: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('deriveEntitlement', () => {
  it('defaults to free with a save limit when no subscription exists', () => {
    const e = deriveEntitlement(null);
    expect(e.isPremium).toBe(false);
    expect(e.saveLimit).toBe(FREE_SAVE_LIMIT);
  });

  it('grants premium for an active monthly subscription', () => {
    const e = deriveEntitlement(sub({ plan: 'monthly', status: 'active' }));
    expect(e.isPremium).toBe(true);
    expect(e.saveLimit).toBeNull();
  });

  it('grants premium for lifetime regardless of status', () => {
    const e = deriveEntitlement(sub({ plan: 'lifetime', status: 'canceled' }));
    expect(e.isPremium).toBe(true);
  });

  it('reverts to free when a subscription is canceled', () => {
    const e = deriveEntitlement(sub({ status: 'canceled' }));
    expect(e.isPremium).toBe(false);
    expect(e.saveLimit).toBe(FREE_SAVE_LIMIT);
  });

  it('reverts to free when past_due', () => {
    const e = deriveEntitlement(sub({ status: 'past_due' }));
    expect(e.isPremium).toBe(false);
  });
});
