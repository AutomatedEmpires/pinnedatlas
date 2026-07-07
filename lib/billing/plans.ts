// Plan definitions. Monthly is the primary, most prominent plan by founder
// mandate; annual and lifetime are secondary. Price IDs come from env so the
// founder can wire real Stripe prices without a code change.

export type PlanKey = 'monthly' | 'annual' | 'lifetime';

export interface Plan {
  key: PlanKey;
  name: string;
  priceLabel: string;
  cadenceLabel: string;
  mode: 'subscription' | 'payment';
  highlight: boolean;
  blurb: string;
}

export const PLANS: Plan[] = [
  {
    key: 'monthly',
    name: 'Atlas Premium',
    priceLabel: '$4.99',
    cadenceLabel: 'per month',
    mode: 'subscription',
    highlight: true,
    blurb: 'Unlimited saves, trip log, personal notes, and advanced filters.',
  },
  {
    key: 'annual',
    name: 'Atlas Premium — Annual',
    priceLabel: '$39.99',
    cadenceLabel: 'per year (save 33%)',
    mode: 'subscription',
    highlight: false,
    blurb: 'Everything in Premium, two-thirds the price.',
  },
  {
    key: 'lifetime',
    name: 'Lifetime',
    priceLabel: '$99',
    cadenceLabel: 'one time',
    mode: 'payment',
    highlight: false,
    blurb: 'One payment, Premium forever.',
  },
];

export const PREMIUM_FEATURES = [
  'Unlimited saved spots (free tier: 10)',
  'Visited log — track everywhere you have been',
  'Personal notes on any location',
  'Advanced filters: difficulty, verified-only',
  'Support accurate, moderated location data',
];
