import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

// GET — get penalty for an invoice
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('invoice_penalties')
    .select('*')
    .eq('invoice_id', id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also get forgiveness history count for this company
  let forgivenCount = 0
  if (data) {
    const { count } = await supabaseAdmin
      .from('invoice_penalties')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', data.company_id)
      .eq('forgiven', true)
    forgivenCount = count || 0
  }

  return NextResponse.json({
    penalty: data || null,
    forgiven_count_for_company: forgivenCount,
  })
}

// POST — forgive penalty
export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only accountants+ can forgive
  const staffRoles = ['accountant', 'admin', 'assistant', 'senior']
  if (!userRole || !staffRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  let body: { reason?: string } = {}
  try {
    body = await request.json()
  } catch { /* empty body OK */ }

  // Fetch penalty
  const { data: penalty, error: fetchError } = await supabaseAdmin
    .from('invoice_penalties')
    .select('id, company_id, forgiven')
    .eq('invoice_id', id)
    .single()

  if (fetchError || !penalty) {
    return NextResponse.json({ error: 'Penále nenalezeno' }, { status: 404 })
  }

  if (penalty.forgiven) {
    return NextResponse.json({ error: 'Penále již bylo prominuto' }, { status: 400 })
  }

  // Check how many times this company had penalties forgiven (warning info)
  const { count: priorForgiven } = await supabaseAdmin
    .from('invoice_penalties')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', penalty.company_id)
    .eq('forgiven', true)

  const { error: updateError } = await supabaseAdmin
    .from('invoice_penalties')
    .update({
      forgiven: true,
      forgiven_at: new Date().toISOString(),
      forgiven_by: userId,
      forgiven_reason: body.reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', penalty.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    forgiven: true,
    prior_forgiven_count: priorForgiven || 0,
    warning: (priorForgiven || 0) >= 2
      ? `Pozor: Pro tuto firmu již bylo prominuto ${priorForgiven} penále.`
      : null,
  })
}
