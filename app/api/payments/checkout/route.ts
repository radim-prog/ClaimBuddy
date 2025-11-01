import { NextRequest } from 'next/server';
import { getAuthUser, errorResponse, successResponse } from '@/lib/api-helpers';
import { createCheckoutSchema } from '@/lib/validations';
import { getCase } from '@/lib/firebase/firestore';
import { createPayment } from '@/lib/firebase/firestore';
import { PAYMENT_STATUS, PRICING } from '@/lib/constants';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();

    // Validace
    const validation = createCheckoutSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400);
    }

    const { caseId, amount, type } = validation.data;

    // Zkontroluj že případ existuje a patří uživateli
    const caseData = await getCase(caseId);
    if (!caseData) {
      return errorResponse('Case not found', 404);
    }

    if (caseData.userId !== user.uid) {
      return errorResponse('Forbidden', 403);
    }

    // Vytvoř payment záznam
    const { id: paymentId, error: paymentError } = await createPayment({
      caseId,
      userId: user.uid,
      amount,
      type,
      status: PAYMENT_STATUS.PENDING,
    });

    if (paymentError || !paymentId) {
      return errorResponse('Failed to create payment', 500);
    }

    // Vytvoř Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'czk',
            product_data: {
              name: type === 'fixed' ? 'ClaimBuddy - Fixní poplatek' : 'ClaimBuddy - Poplatek za úspěch',
              description: `Případ ${caseData.caseNumber}`,
            },
            unit_amount: Math.round(amount), // Stripe očekává částku v haléřích/centech
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cases/${caseId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cases/${caseId}?payment=cancelled`,
      metadata: {
        caseId,
        userId: user.uid,
        paymentId,
        type,
      },
    });

    return successResponse({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('POST /api/payments/checkout error:', error);
    return errorResponse(error.message || 'Payment service error', 500);
  }
}
