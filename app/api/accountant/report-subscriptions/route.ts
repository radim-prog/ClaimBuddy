import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET — fetch user's report subscriptions
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('report_subscriptions')
    .select('id, report_type, frequency, enabled, last_sent_at')
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ subscriptions: data ?? [] })
}

// PUT — upsert report subscriptions
export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userEmail = request.headers.get('x-user-email')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const subscriptions = body.subscriptions as {
      report_type: string
      frequency: 'weekly' | 'monthly'
      enabled: boolean
    }[]

    if (!Array.isArray(subscriptions)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Get user email if not in header
    let email = userEmail
    if (!email) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()
      email = user?.email
    }

    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // Upsert each subscription
    for (const sub of subscriptions) {
      await supabaseAdmin
        .from('report_subscriptions')
        .upsert(
          {
            user_id: userId,
            report_type: sub.report_type,
            frequency: sub.frequency,
            email,
            enabled: sub.enabled,
            updated_at: now,
          },
          { onConflict: 'user_id,report_type' }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Report subscriptions PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
