import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { errorResponse, successResponse } from '@/lib/api-helpers';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2024-06-20' as any });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return errorResponse('Stripe webhook disabled', 503);
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return errorResponse('Missing STRIPE_WEBHOOK_SECRET', 503);
  }

  try {
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return errorResponse('Missing stripe-signature header', 400);
    }

    const payload = await request.text();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Stripe checkout completed for case', session.metadata?.caseId, session.id);
    }

    return successResponse({ received: true });
  } catch (error: any) {
    return errorResponse(error.message || 'Webhook error', 400);
  }
}
