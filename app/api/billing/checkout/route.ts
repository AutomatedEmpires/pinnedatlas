import { NextResponse } from 'next/server';
import { z } from 'zod';
import type Stripe from 'stripe';
import { requireUserId, UnauthorizedError } from '@/lib/auth';
import { getStripe, priceIdForPlan } from '@/lib/billing/stripe';
import { getSubscription, upsertSubscription } from '@/lib/db/subscriptions';
import { env } from '@/lib/env';

const bodySchema = z.object({
  plan: z.enum(['monthly', 'annual', 'lifetime']),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_plan' }, { status: 400 });
    }
    const { plan } = parsed.data;

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'billing_unconfigured' }, { status: 503 });
    }
    const priceId = priceIdForPlan(plan);
    if (!priceId) {
      return NextResponse.json({ error: 'billing_unconfigured' }, { status: 503 });
    }

    const existing = await getSubscription(userId);
    let customerId = existing?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { clerk_user_id: userId },
      });
      customerId = customer.id;
      await upsertSubscription({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: null,
        status: 'none',
        plan: 'none',
        current_period_end: null,
      });
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: plan === 'lifetime' ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: env.appUrl + '/account?checkout=success',
      cancel_url: env.appUrl + '/pricing',
      metadata: { user_id: userId, plan },
    };
    if (plan !== 'lifetime') {
      params.subscription_data = { metadata: { user_id: userId, plan } };
    }
    const session = await stripe.checkout.sessions.create(params);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    console.error('billing/checkout error', err);
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 });
  }
}
