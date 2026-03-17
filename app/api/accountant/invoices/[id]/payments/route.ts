import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/accountant/invoices/[id]/payments — list partial payments
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const { data, error } = await supabaseAdmin
      .from('partial_payments')
      .select('*, created_by_user:users!created_by(id, name)')
      .eq('invoice_id', id)
      .order('payment_date', { ascending: true })

    if (error) throw error

    // Calculate total paid
    const totalPaid = (data ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

    return NextResponse.json({ payments: data ?? [], total_paid: totalPaid })
  } catch (error) {
    console.error('Partial payments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/accountant/invoices/[id]/payments — add a partial payment
export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { amount, payment_date, method, note } = body

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Částka musí být kladná' }, { status: 400 })
    }

    const validMethods = ['bank_transfer', 'card', 'cash', 'other']

    const { data: payment, error: insertError } = await supabaseAdmin
      .from('partial_payments')
      .insert({
        invoice_id: id,
        amount: Number(amount),
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        method: validMethods.includes(method) ? method : 'bank_transfer',
        note: note?.trim() || null,
        created_by: userId,
      })
      .select('*')
      .single()

    if (insertError) throw insertError

    // Recalculate total paid and update invoice
    const { data: allPayments } = await supabaseAdmin
      .from('partial_payments')
      .select('amount')
      .eq('invoice_id', id)

    const totalPaid = (allPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

    // Fetch invoice to check total
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('total_with_vat')
      .eq('id', id)
      .single()

    const invoiceTotal = invoice ? Number(invoice.total_with_vat) : 0
    const isFullyPaid = invoiceTotal > 0 && totalPaid >= invoiceTotal

    await supabaseAdmin
      .from('invoices')
      .update({
        paid_amount: totalPaid,
        payment_status: isFullyPaid ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
        paid_at: isFullyPaid ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({ payment, total_paid: totalPaid }, { status: 201 })
  } catch (error) {
    console.error('Partial payments POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
