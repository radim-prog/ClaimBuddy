import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const companyId = searchParams.get('company_id')
    const eventType = searchParams.get('event_type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200)

    let query = supabaseAdmin
      .from('client_events')
      .select('*, companies(name, ico)')
      .order('event_date', { ascending: false })
      .limit(limit)

    if (year) {
      query = query
        .gte('event_date', `${year}-01-01`)
        .lte('event_date', `${year}-12-31`)
    }
    if (companyId) query = query.eq('company_id', companyId)
    if (eventType) query = query.eq('event_type', eventType)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ events: data || [] })
  } catch (error) {
    console.error('Events fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { company_id, event_type, event_date, monthly_fee, previous_fee, notes } = body

    if (!company_id || !event_type || !event_date) {
      return NextResponse.json({ error: 'company_id, event_type, and event_date are required' }, { status: 400 })
    }

    const validTypes = ['onboarded', 'churned', 'paused', 'fee_changed']
    if (!validTypes.includes(event_type)) {
      return NextResponse.json({ error: `event_type must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('client_events')
      .insert({
        company_id,
        event_type,
        event_date,
        monthly_fee: monthly_fee != null ? Number(monthly_fee) : null,
        previous_fee: previous_fee != null ? Number(previous_fee) : null,
        notes: notes || null,
        created_by: userId,
      })
      .select('*, companies(name, ico)')
      .single()

    if (error) throw error

    // If churned, update company status
    if (event_type === 'churned') {
      await supabaseAdmin
        .from('companies')
        .update({
          status: 'churned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', company_id)
    }

    // If paused, update company status
    if (event_type === 'paused') {
      await supabaseAdmin
        .from('companies')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString(),
        })
        .eq('id', company_id)
    }

    return NextResponse.json({ event: data }, { status: 201 })
  } catch (error) {
    console.error('Event create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
