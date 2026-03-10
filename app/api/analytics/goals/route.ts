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
    const year = searchParams.get('year') || new Date().getFullYear()

    const { data, error } = await supabaseAdmin
      .from('revenue_goals')
      .select('*')
      .eq('year', Number(year))
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ goal: data })
  } catch (error) {
    console.error('Goals fetch error:', error)
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
    const { year, annual_revenue_target, monthly_targets, notes } = body

    if (!year || !annual_revenue_target) {
      return NextResponse.json({ error: 'year and annual_revenue_target are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('revenue_goals')
      .upsert({
        year: Number(year),
        annual_revenue_target: Number(annual_revenue_target),
        monthly_targets: monthly_targets || {},
        notes: notes || null,
        created_by: userId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'year' })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ goal: data }, { status: 201 })
  } catch (error) {
    console.error('Goals create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
