import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const actionFilter = searchParams.get('action') || null
  const dateFrom = searchParams.get('date_from') || null
  const dateTo = searchParams.get('date_to') || null

  let query = supabaseAdmin
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (actionFilter) {
    query = query.eq('action', actionFilter)
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo)
  }

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get user names
  const logs = data ?? []
  let logsWithNames = logs
  if (logs.length > 0) {
    const userIds = [...new Set(logs.map(l => l.user_id).filter(Boolean))]
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin.from('users').select('id, name').in('id', userIds)
      const userMap = new Map((users ?? []).map(u => [u.id, u.name]))
      logsWithNames = logs.map(l => ({
        ...l,
        user_name: l.user_id ? (userMap.get(l.user_id) || 'Neznámý') : 'Systém',
      }))
    }
  }

  return NextResponse.json({
    logs: logsWithNames,
    total: count ?? 0,
    page,
    limit,
    total_pages: Math.ceil((count ?? 0) / limit),
  })
}
