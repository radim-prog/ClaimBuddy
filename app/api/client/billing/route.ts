import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getStripe, findOrCreateStripeCustomer } from '@/lib/stripe'
import { getUserById } from '@/lib/user-store'
import { getStripeCustomerId, setStripeCustomerId } from '@/lib/subscription-store'

export const dynamic = 'force-dynamic'

// GET: list billing invoices for client's company
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = request.nextUrl.searchParams.get('company_id')
  if (!companyId) {
    return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
  }

  // Verify client owns this company
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id, name')
    .eq('id', companyId)
    .eq('owner_id', userId)
    .single()

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  const { data: invoices, error } = await supabaseAdmin
    .from('billing_invoices')
    .select('id, period, amount_due, status, due_date, paid_at, created_at')
    .eq('company_id', companyId)
    .order('period', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }

  // Also fetch linked invoices for PDF/QR (variable_symbol, invoice_number)
  const billingIds = (invoices ?? []).map(i => i.id)
  let linkedInvoices: Record<string, { id: string; invoice_number: string; variable_symbol: string }> = {}
  if (billingIds.length > 0) {
    const { data: linked } = await supabaseAdmin
      .from('invoices')
      .select('id, billing_invoice_id, invoice_number, variable_symbol')
      .in('billing_invoice_id', billingIds)

    for (const inv of linked ?? []) {
      if (inv.billing_invoice_id) {
        linkedInvoices[inv.billing_invoice_id] = {
          id: inv.id,
          invoice_number: inv.invoice_number,
          variable_symbol: inv.variable_symbol,
        }
      }
    }
  }

  const result = (invoices ?? []).map(inv => ({
    ...inv,
    linked_invoice: linkedInvoices[inv.id] || null,
  }))

  return NextResponse.json({ invoices: result, company_name: company.name })
}

// POST: create Stripe Checkout session for a billing invoice
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await request.json()
  const { billing_invoice_id } = body as { billing_invoice_id: string }

  if (!billing_invoice_id) {
    return NextResponse.json({ error: 'billing_invoice_id is required' }, { status: 400 })
  }

  // Fetch billing invoice and verify ownership
  const { data: billingInvoice } = await supabaseAdmin
    .from('billing_invoices')
    .select('id, company_id, amount_due, period, status, config_id')
    .eq('id', billing_invoice_id)
    .single()

  if (!billingInvoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (billingInvoice.status === 'paid') {
    return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
  }

  // Verify client owns this company
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('id', billingInvoice.company_id)
    .eq('owner_id', userId)
    .single()

  if (!company) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Find or create Stripe customer
  const user = await getUserById(userId)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const existingCustomerId = await getStripeCustomerId(userId)
  const customerId = await findOrCreateStripeCustomer(userId, user.email, user.name, existingCustomerId)
  if (customerId && customerId !== existingCustomerId) {
    await setStripeCustomerId(userId, customerId)
  }

  const origin = request.headers.get('origin') || 'https://app.zajcon.cz'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'czk',
        product_data: {
          name: `Účetní služby – ${billingInvoice.period}`,
        },
        unit_amount: Math.round(billingInvoice.amount_due * 100),
      },
      quantity: 1,
    }],
    success_url: `${origin}/client/billing?success=true`,
    cancel_url: `${origin}/client/billing?cancelled=true`,
    locale: 'cs',
    metadata: {
      user_id: userId,
      type: 'billing_service',
      billing_invoice_id: billingInvoice.id,
      config_id: billingInvoice.config_id,
      company_id: billingInvoice.company_id,
    },
    ...(customerId ? { customer: customerId } : {}),
  })

  return NextResponse.json({ url: session.url })
}
