import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

// GET - detail with time entries
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const { data: project, error } = await supabaseAdmin
      .from('prepaid_projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch associated time entries
    const { data: entries } = await supabaseAdmin
      .from('time_logs')
      .select('*')
      .eq('prepaid_project_id', id)
      .order('date', { ascending: false })

    return NextResponse.json({ project, entries: entries || [] })
  } catch (error) {
    console.error('Prepaid project GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - update project (status, payment, override)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await request.json()

    const ALLOWED_FIELDS = [
      'title', 'description', 'estimated_hours', 'hourly_rate',
      'travel_cost', 'other_costs', 'payment_status', 'paid_amount',
      'paid_at', 'invoice_id', 'notify_at_80', 'notify_at_100',
      'billing_override', 'override_reason', 'status',
    ]

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    // If billing_override is being set, record who did it
    if (body.billing_override !== undefined) {
      updates.override_by = userId
    }

    // Recalculate total_budget if any cost field changed
    if (body.estimated_hours !== undefined || body.hourly_rate !== undefined ||
        body.travel_cost !== undefined || body.other_costs !== undefined) {
      // Fetch current values to merge
      const { data: current } = await supabaseAdmin
        .from('prepaid_projects')
        .select('estimated_hours, hourly_rate, travel_cost, other_costs')
        .eq('id', id)
        .single()

      if (current) {
        const hours = Number(updates.estimated_hours ?? current.estimated_hours) || 0
        const rate = Number(updates.hourly_rate ?? current.hourly_rate) || 700
        const travel = Number(updates.travel_cost ?? current.travel_cost) || 0
        const other = Number(updates.other_costs ?? current.other_costs) || 0
        updates.total_budget = hours * rate + travel + other
      }
    }

    const { data, error } = await supabaseAdmin
      .from('prepaid_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating prepaid project:', error)
      return NextResponse.json({ error: 'Failed to update prepaid project' }, { status: 500 })
    }

    return NextResponse.json({ success: true, project: data })
  } catch (error) {
    console.error('Prepaid project PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - soft delete (cancel)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const { error } = await supabaseAdmin
      .from('prepaid_projects')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error cancelling prepaid project:', error)
      return NextResponse.json({ error: 'Failed to cancel prepaid project' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Prepaid project DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
