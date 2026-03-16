import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { syncContact } from '@/lib/marketing-service'

export const dynamic = 'force-dynamic'

// POST: Manually trigger contact sync (admin only)
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || userRole !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const targetUserId = body.userId // optional: sync single user

  try {
    if (targetUserId) {
      const result = await syncContact(targetUserId)
      return NextResponse.json(result)
    }

    // Sync all
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('status', 'active')
      .not('email', 'is', null)

    let synced = 0, errors = 0
    for (const user of users || []) {
      const result = await syncContact(user.id)
      if (result.synced) synced++
      else errors++
    }

    return NextResponse.json({ synced, errors, total: (users || []).length })
  } catch (error) {
    console.error('[Marketing sync] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
