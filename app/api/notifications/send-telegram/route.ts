import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendTelegramMessage } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { chat_id, message, template, company_id } = body

    if (!chat_id || !message) {
      return NextResponse.json({ error: 'Missing chat_id or message' }, { status: 400 })
    }

    const result = await sendTelegramMessage(chat_id, message)

    // Log to notification_log
    await supabaseAdmin
      .from('notification_log')
      .insert({
        company_id: company_id || null,
        channel: 'telegram',
        template: template || 'custom',
        status: result.ok ? 'sent' : 'failed',
        metadata: {
          chat_id,
          message_id: result.messageId,
          error: result.error,
        },
      })

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Send failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message_id: result.messageId })
  } catch (error) {
    console.error('Telegram send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
