import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const DEFAULT_PREFERENCES = {
  email: true,
  telegram: false,
  types: {
    missing_document_tax_impact: true,
    invoice_due_reminder: true,
    monthly_summary: true,
  },
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('notification_preferences, telegram_chat_id, email')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json({
        preferences: DEFAULT_PREFERENCES,
        telegram_chat_id: null,
        email: null,
      })
    }

    return NextResponse.json({
      preferences: data.notification_preferences || DEFAULT_PREFERENCES,
      telegram_chat_id: data.telegram_chat_id || null,
      email: data.email || null,
    })
  } catch (error) {
    console.error('[NotificationPrefs] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.preferences !== undefined) {
      updates.notification_preferences = body.preferences
    }

    if (body.telegram_chat_id !== undefined) {
      updates.telegram_chat_id = body.telegram_chat_id || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[NotificationPrefs] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
