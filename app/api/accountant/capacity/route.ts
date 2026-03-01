import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET all team members' capacity
export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin' && userRole !== 'accountant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Get all accountants/admins/assistants
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, role, weekly_hours_capacity, work_schedule')
      .in('role', ['accountant', 'admin', 'assistant'])
      .order('name')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get all overrides
    const userIds = (users || []).map(u => u.id)
    const { data: overrides } = await supabaseAdmin
      .from('user_capacity_overrides')
      .select('*')
      .in('user_id', userIds)
      .gte('date_to', new Date().toISOString().split('T')[0])
      .order('date_from')

    const overridesByUser: Record<string, typeof overrides> = {}
    for (const o of overrides || []) {
      if (!overridesByUser[o.user_id]) overridesByUser[o.user_id] = []
      overridesByUser[o.user_id]!.push(o)
    }

    const capacities = (users || []).map(u => ({
      user_id: u.id,
      user_name: u.name,
      role: u.role,
      weekly_hours_capacity: u.weekly_hours_capacity || 40,
      work_schedule: u.work_schedule || { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
      overrides: overridesByUser[u.id] || [],
    }))

    return NextResponse.json({ capacities })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
