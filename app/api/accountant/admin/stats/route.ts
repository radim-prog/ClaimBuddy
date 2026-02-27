import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [usersRes, companiesRes, auditTodayRes, timeLogsMonthRes, recentActivityRes] = await Promise.all([
    supabaseAdmin.from('users').select('id, last_login_at', { count: 'exact' }),
    supabaseAdmin.from('companies').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('audit_log').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabaseAdmin.from('time_logs').select('hours').gte('date', monthStart.split('T')[0]),
    supabaseAdmin.from('audit_log').select('id, user_id, action, table_name, record_id, created_at').order('created_at', { ascending: false }).limit(10),
  ])

  const totalUsers = usersRes.count ?? 0
  const activeUsers = (usersRes.data ?? []).filter(u => u.last_login_at && u.last_login_at >= thirtyDaysAgo).length
  const companiesCount = companiesRes.count ?? 0
  const auditTodayCount = auditTodayRes.count ?? 0
  const monthHours = (timeLogsMonthRes.data ?? []).reduce((sum, r) => sum + (Number(r.hours) || 0), 0)

  // Get user names for recent activity
  const recentActivity = recentActivityRes.data ?? []
  let activityWithNames = recentActivity
  if (recentActivity.length > 0) {
    const userIds = [...new Set(recentActivity.map(a => a.user_id).filter(Boolean))]
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin.from('users').select('id, name').in('id', userIds)
      const userMap = new Map((users ?? []).map(u => [u.id, u.name]))
      activityWithNames = recentActivity.map(a => ({
        ...a,
        user_name: a.user_id ? (userMap.get(a.user_id) || 'Neznámý') : 'Systém',
      }))
    }
  }

  return NextResponse.json({
    users: { total: totalUsers, active: activeUsers },
    companies: { total: companiesCount },
    audit: { today_count: auditTodayCount },
    time_logs: { month_hours: monthHours },
    recent_activity: activityWithNames,
  })
}
