import { NextResponse } from 'next/server';
import { requireUserId, UnauthorizedError } from '@/lib/auth';
import { getStripe } from '@/lib/billing/stripe';
import { getSubscription } from '@/lib/db/subscriptions';
import { env } from '@/lib/env';

export async function POST() {
  try {
    const userId = await requireUserId();

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'billing_unconfigured' }, { status: 503 });
    }

    const sub = await getSubscription(userId);
    const customerId = sub?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json({ error: 'no_customer' }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: env.appUrl + '/account',
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    console.error('billing/portal error', err);
    return NextResponse.json({ error: 'portal_failed' }, { status: 500 });
  }
}
