import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin' && userRole !== 'accountant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const periodStart = searchParams.get('from') || getWeekStart()
    const periodEnd = searchParams.get('to') || getWeekEnd()

    // Get all team members
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, weekly_hours_capacity, work_schedule')
      .in('role', ['accountant', 'admin', 'assistant'])
      .order('name')

    if (!users || users.length === 0) {
      return NextResponse.json({ workload: [] })
    }

    const userIds = users.map(u => u.id)

    // Get overrides for the period
    const { data: overrides } = await supabaseAdmin
      .from('user_capacity_overrides')
      .select('*')
      .in('user_id', userIds)
      .lte('date_from', periodEnd)
      .gte('date_to', periodStart)

    // Get assigned tasks (pending/in_progress)
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('assigned_to, estimated_minutes, actual_minutes, status')
      .in('assigned_to', userIds)
      .in('status', ['pending', 'in_progress', 'accepted', 'waiting_for', 'waiting_client'])

    // Get actual time logs for the period
    const { data: timeLogs } = await supabaseAdmin
      .from('time_logs')
      .select('user_id, hours, minutes')
      .in('user_id', userIds)
      .gte('date', periodStart)
      .lte('date', periodEnd)

    const workload = users.map(user => {
      const weeklyHours = user.weekly_hours_capacity || 40

      // Calculate override reduction
      const userOverrides = (overrides || []).filter(o => o.user_id === user.id)
      const overrideReduction = calculateOverrideHours(userOverrides, periodStart, periodEnd, user.work_schedule)

      const availableHours = weeklyHours - overrideReduction

      // Assigned estimated hours
      const userTasks = (tasks || []).filter(t => t.assigned_to === user.id)
      const assignedMinutes = userTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
      const assignedHours = assignedMinutes / 60

      // Actual hours in period
      const userLogs = (timeLogs || []).filter(l => l.user_id === user.id)
      const actualHours = userLogs.reduce((sum, l) => sum + (l.hours || 0) + ((l.minutes || 0) / 60), 0)

      const utilizationPct = availableHours > 0 ? Math.round((assignedHours / availableHours) * 100) : 0
      const variancePct = assignedHours > 0 ? Math.round(((actualHours - assignedHours) / assignedHours) * 100) : 0

      return {
        user_id: user.id,
        user_name: user.name,
        available_hours: Math.round(availableHours * 10) / 10,
        assigned_estimated_hours: Math.round(assignedHours * 10) / 10,
        actual_hours: Math.round(actualHours * 10) / 10,
        utilization_pct: utilizationPct,
        variance_pct: variancePct,
        task_count: userTasks.length,
      }
    })

    return NextResponse.json({ workload, period: { from: periodStart, to: periodEnd } })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

function getWeekEnd(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? 0 : 7)
  const sunday = new Date(d.setDate(diff))
  return sunday.toISOString().split('T')[0]
}

function calculateOverrideHours(
  overrides: Array<{ date_from: string; date_to: string; daily_hours: number }>,
  periodStart: string,
  periodEnd: string,
  workSchedule: Record<string, number> | null
): number {
  const schedule = workSchedule || { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 }
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  let totalReduction = 0

  for (const override of overrides) {
    const start = new Date(Math.max(new Date(override.date_from).getTime(), new Date(periodStart).getTime()))
    const end = new Date(Math.min(new Date(override.date_to).getTime(), new Date(periodEnd).getTime()))

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = dayNames[d.getDay()]
      const normalHours = schedule[dayName] || 0
      const overrideHours = override.daily_hours || 0
      totalReduction += Math.max(0, normalHours - overrideHours)
    }
  }

  return totalReduction
}
