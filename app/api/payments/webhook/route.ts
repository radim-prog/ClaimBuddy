import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { updatePayment, updateCase } from '@/lib/firebase/firestore';
import { PAYMENT_STATUS } from '@/lib/constants';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return errorResponse('No signature', 400);
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return errorResponse('Invalid signature', 400);
    }

    // Zpracuj event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { caseId, paymentId } = session.metadata || {};

        if (caseId && paymentId) {
          // Aktualizuj payment
          await updatePayment(paymentId, {
            status: PAYMENT_STATUS.COMPLETED,
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            paidAt: new Date(),
          });

          // Aktualizuj case
          await updateCase(caseId, {
            paymentId,
            paymentStatus: PAYMENT_STATUS.COMPLETED,
          });

          console.log(`Payment completed for case ${caseId}`);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { paymentId } = session.metadata || {};

        if (paymentId) {
          await updatePayment(paymentId, {
            status: PAYMENT_STATUS.FAILED,
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        // Najdi payment podle stripePaymentIntentId a aktualizuj status
        // V production aplikaci bychom měli mít index pro rychlé vyhledávání
        console.log('Charge refunded:', charge.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return successResponse({ received: true });
  } catch (error: any) {
    console.error('POST /api/payments/webhook error:', error);
    return errorResponse(error.message || 'Webhook error', 500);
  }
}
