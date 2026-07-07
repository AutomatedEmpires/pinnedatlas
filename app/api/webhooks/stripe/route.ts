import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/billing/stripe';
import { findUserIdByCustomer, getSubscription, upsertSubscription } from '@/lib/db/subscriptions';
import { env } from '@/lib/env';
import type { SubscriptionRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

function planFromPriceId(
  priceId: string | undefined,
  existingPlan: SubscriptionRecord['plan'] | undefined,
): SubscriptionRecord['plan'] {
  if (priceId && priceId === env.stripePriceMonthly) return 'monthly';
  if (priceId && priceId === env.stripePriceAnnual) return 'annual';
  if (existingPlan && existingPlan !== 'none') return existingPlan;
  return 'monthly';
}

async function handleSubscriptionEvent(sub: Stripe.Subscription, deleted: boolean) {
  const userId =
    sub.metadata?.user_id ?? (await findUserIdByCustomer(sub.customer as string));
  if (!userId) return;

  const existing = await getSubscription(userId);
  // Lifetime is a one-time purchase; a stray subscription event must never
  // downgrade it.
  if (existing?.plan === 'lifetime') return;

  const item = sub.items.data[0];
  const plan = planFromPriceId(item?.price?.id, existing?.plan);
  // Stripe API v2025+ (basil): the billing period lives on the subscription item.
  const periodEnd = item?.current_period_end;

  await upsertSubscription({
    user_id: userId,
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    status: deleted ? 'canceled' : sub.status,
    plan,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  });
}

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: 'billing_unconfigured' }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        if (session.mode === 'payment' && session.metadata?.plan === 'lifetime' && userId) {
          await upsertSubscription({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: null,
            status: 'lifetime',
            plan: 'lifetime',
            current_period_end: null,
          });
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionEvent(event.data.object, false);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event.data.object, true);
        break;
      default:
        // Ignore all other event types; acknowledge so Stripe stops retrying.
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('stripe webhook error', event.type, err);
    return NextResponse.json({ error: 'webhook_handler_failed' }, { status: 500 });
  }
}
