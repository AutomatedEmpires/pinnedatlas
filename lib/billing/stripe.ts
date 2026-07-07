import 'server-only';
import Stripe from 'stripe';
import { env, hasStripe } from '@/lib/env';
import type { PlanKey } from '@/lib/billing/plans';

let cached: Stripe | null = null;

/** Lazy Stripe client; null when STRIPE_SECRET_KEY is not configured. */
export function getStripe(): Stripe | null {
  if (!hasStripe) return null;
  if (!cached) {
    cached = new Stripe(env.stripeSecretKey);
  }
  return cached;
}

export function priceIdForPlan(plan: PlanKey): string {
  switch (plan) {
    case 'monthly':
      return env.stripePriceMonthly;
    case 'annual':
      return env.stripePriceAnnual;
    case 'lifetime':
      return env.stripePriceLifetime;
  }
}
