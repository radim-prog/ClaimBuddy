import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET /api/client/reminders?status=active&limit=20
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Look up user's company_id
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single()

    if (!user?.company_id) {
      return NextResponse.json({ reminders: [] })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    let query = supabaseAdmin
      .from('reminders')
      .select('id, type, message, frequency, escalation_level, status, channels, metadata, created_at, resolved_at')
      .eq('company_id', user.company_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Also get delivery count for each reminder
    const reminders = await Promise.all((data || []).map(async (r) => {
      const { count } = await supabaseAdmin
        .from('reminder_deliveries')
        .select('id', { count: 'exact', head: true })
        .eq('reminder_id', r.id)
        .eq('status', 'delivered')

      return {
        ...r,
        deliveries_sent: count || 0,
      }
    }))

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('[ClientReminders] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
