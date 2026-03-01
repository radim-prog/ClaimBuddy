import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// PATCH: user sets their own capacity
export async function PATCH(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.weekly_hours_capacity !== undefined) {
      updates.weekly_hours_capacity = body.weekly_hours_capacity
    }
    if (body.work_schedule !== undefined) {
      updates.work_schedule = body.work_schedule
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, name, weekly_hours_capacity, work_schedule')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update capacity' }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
