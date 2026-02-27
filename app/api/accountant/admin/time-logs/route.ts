import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filterUserId = searchParams.get('user_id') || null
  const companyId = searchParams.get('company_id') || null
  const dateFrom = searchParams.get('date_from') || null
  const dateTo = searchParams.get('date_to') || null

  let query = supabaseAdmin
    .from('time_logs')
    .select('*')
    .order('date', { ascending: false })
    .limit(200)

  if (filterUserId) {
    query = query.eq('user_id', filterUserId)
  }
  if (companyId) {
    query = query.eq('company_id', companyId)
  }
  if (dateFrom) {
    query = query.gte('date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('date', dateTo)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const logs = data ?? []
  const totalHours = logs.reduce((sum, r) => sum + (Number(r.hours) || 0), 0)
  const totalMinutes = logs.reduce((sum, r) => sum + (Number(r.minutes) || 0), 0)

  return NextResponse.json({
    logs,
    summary: {
      total_entries: logs.length,
      total_hours: totalHours + Math.floor(totalMinutes / 60),
      total_minutes: totalMinutes % 60,
    },
  })
}
