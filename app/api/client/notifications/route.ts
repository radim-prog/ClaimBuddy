import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json({ notifications: [] })
    }

    const { data, error } = await supabaseAdmin
      .from('client_notifications')
      .select('*')
      .eq('company_id', user.company_id)
      .in('status', ['active', 'dismissed'])
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Sort: urgent first, then warning, then info
    const severityOrder: Record<string, number> = { urgent: 0, warning: 1, info: 2 }
    const sorted = (data || []).sort((a, b) =>
      (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
    )

    return NextResponse.json({ notifications: sorted })
  } catch (error) {
    console.error('Client notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
