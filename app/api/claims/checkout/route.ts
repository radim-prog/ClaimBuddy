import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const PRICE_MAP: Record<string, { priceId: string | undefined; amount: number; label: string }> = {
  ai_processing: { priceId: process.env.STRIPE_CLAIMS_AI_PRICE_ID, amount: 19900, label: 'Pojistná Pomoc — AI analýza' },
  consultation: { priceId: process.env.STRIPE_CLAIMS_CONSULTATION_PRICE_ID, amount: 149900, label: 'Pojistná Pomoc — Konzultace' },
  full_representation: { priceId: process.env.STRIPE_CLAIMS_REPRESENTATION_PRICE_ID, amount: 149900, label: 'Pojistná Pomoc — Plné zastoupení' },
}

// POST /api/claims/checkout — create Stripe Checkout Session for claims service
export async function POST(request: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  try {
    const { caseId, serviceMode } = await request.json()

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 })
    }
    const priceConfig = PRICE_MAP[serviceMode]
    if (!serviceMode || !priceConfig) {
      return NextResponse.json({ error: 'serviceMode must be ai_processing, consultation, or full_representation' }, { status: 400 })
    }

    // Verify the case exists
    const { data: caseData, error: caseErr } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, case_number, payment_status')
      .eq('id', caseId)
      .single()

    if (caseErr || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    if (caseData.payment_status === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 409 })
    }

    // Try to get user_id from headers (staff) or use case_id as reference
    const userId = request.headers.get('x-user-id') || 'anonymous'

    const origin = request.nextUrl.origin

    const lineItem = priceConfig.priceId
      ? { price: priceConfig.priceId, quantity: 1 }
      : {
          price_data: {
            currency: 'czk' as const,
            unit_amount: priceConfig.amount,
            product_data: {
              name: priceConfig.label,
              description: `Spis: ${caseData.case_number || caseId}`,
            },
          },
          quantity: 1,
        }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [lineItem],
      metadata: {
        type: 'claims_service',
        case_id: caseId,
        service_mode: serviceMode,
        user_id: userId,
      },
      success_url: `${origin}/claims/payment-success?session_id={CHECKOUT_SESSION_ID}&case_id=${caseId}`,
      cancel_url: `${origin}/claims/choose-service?case_id=${caseId}`,
    })

    // Mark payment as pending
    await supabaseAdmin
      .from('insurance_cases')
      .update({
        service_mode: serviceMode,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[Claims checkout] Error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
