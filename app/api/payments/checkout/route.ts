import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { requireAdminRequest } from '@/lib/admin-auth';

const schema = z.object({
  caseId: z.string().min(6),
  amountCzk: z.number().int().positive(),
  customerEmail: z.string().email(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2024-06-20' as any });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  const stripe = getStripe();
  if (!stripe) {
    return errorResponse('Platby nejsou nakonfigurovány (chybí STRIPE_SECRET_KEY).', 503);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid payment payload', 400);
    }

    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const successUrl = parsed.data.successUrl || `${baseUrl}/admin/cases/${parsed.data.caseId}?payment=success`;
    const cancelUrl = parsed.data.cancelUrl || `${baseUrl}/admin/cases/${parsed.data.caseId}?payment=cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: parsed.data.customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        caseId: parsed.data.caseId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'czk',
            unit_amount: parsed.data.amountCzk,
            product_data: {
              name: `Pojistná Pomoc - případ ${parsed.data.caseId}`,
            },
          },
        },
      ],
    });

    return successResponse({ checkoutUrl: session.url, sessionId: session.id }, 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create checkout', 500);
  }
}
