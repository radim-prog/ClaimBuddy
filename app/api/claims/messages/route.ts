import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET /api/claims/messages?company_id=<uuid>
// Returns messages for a company chat (claims context)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  if (!companyId) return NextResponse.json({ error: 'company_id is required' }, { status: 400 })

  try {
    // Find or create a company chat for claims context
    let { data: chat } = await supabaseAdmin
      .from('chats')
      .select('id')
      .eq('company_id', companyId)
      .eq('type', 'company_chat')
      .eq('subject', 'Pojistné události')
      .maybeSingle()

    if (!chat) {
      // No claims chat yet — return empty list (will be created on first POST)
      return NextResponse.json({ messages: [] })
    }

    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('id, sender_id, sender_type, content, created_at, read')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) throw error

    // Map to frontend format
    const mapped = (messages ?? []).map(m => ({
      id: m.id,
      sender_id: m.sender_id,
      sender_name: m.sender_type === 'accountant' ? 'Účetní' : 'Klient',
      text: m.content,
      created_at: m.created_at,
      is_read: m.read,
      is_own: m.sender_id === userId,
    }))

    return NextResponse.json({ messages: mapped })
  } catch (error) {
    console.error('[Claims messages] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/claims/messages — send a message in claims chat
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { company_id, text } = body

    if (!company_id || !text?.trim()) {
      return NextResponse.json({ error: 'company_id and text are required' }, { status: 400 })
    }

    // Find or create claims chat for this company
    let { data: chat } = await supabaseAdmin
      .from('chats')
      .select('id')
      .eq('company_id', company_id)
      .eq('type', 'company_chat')
      .eq('subject', 'Pojistné události')
      .maybeSingle()

    if (!chat) {
      const { data: newChat, error: chatErr } = await supabaseAdmin
        .from('chats')
        .insert({
          company_id,
          type: 'company_chat',
          subject: 'Pojistné události',
          started_by: 'accountant',
          status: 'open',
        })
        .select('id')
        .single()

      if (chatErr) throw chatErr
      chat = newChat
    }

    // Insert message
    const { data: message, error: msgErr } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        chat_id: chat!.id,
        sender_id: userId,
        sender_type: 'accountant',
        content: text.trim(),
        read: false,
      })
      .select()
      .single()

    if (msgErr) throw msgErr

    // Update chat last_message
    await supabaseAdmin
      .from('chats')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: text.trim().substring(0, 100),
      })
      .eq('id', chat!.id)

    return NextResponse.json({
      message: {
        id: message.id,
        text: message.content,
        created_at: message.created_at,
        is_own: true,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[Claims messages] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
