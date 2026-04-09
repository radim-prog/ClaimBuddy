import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { getUserName } from '@/lib/request-utils'

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
    const { data: chats, error: chatsError } = await supabaseAdmin
      .from('chats')
      .select('id, subject, created_at')
      .eq('company_id', companyId)
      .eq('type', 'company_chat')
      .order('last_message_at', { ascending: true })
      .order('created_at', { ascending: true })

    if (chatsError) throw chatsError

    if (!chats || chats.length === 0) {
      return NextResponse.json({ messages: [] })
    }

    const chatIds = chats.map((chat) => chat.id)
    const subjectByChatId = new Map(chats.map((chat) => [chat.id, chat.subject || 'Bez předmětu']))
    const hasMultipleChats = chats.length > 1

    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('id, chat_id, sender_id, sender_name, sender_type, text, created_at, read')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: true })
      .limit(500)

    if (error) throw error

    const mapped = (messages ?? []).map(m => ({
      id: m.id,
      chat_id: m.chat_id,
      sender_id: m.sender_id,
      sender_name: hasMultipleChats
        ? `${m.sender_name || (m.sender_type === 'accountant' ? 'Účetní' : 'Klient')} · ${subjectByChatId.get(m.chat_id) || 'Bez předmětu'}`
        : (m.sender_name || (m.sender_type === 'accountant' ? 'Účetní' : 'Klient')),
      text: m.text,
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

    const senderName = getUserName(request, 'Účetní')

    let { data: chat, error: chatLookupError } = await supabaseAdmin
      .from('chats')
      .select('id')
      .eq('company_id', company_id)
      .eq('type', 'company_chat')
      .eq('status', 'open')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (chatLookupError) throw chatLookupError

    if (!chat) {
      const { data: newChat, error: chatErr } = await supabaseAdmin
        .from('chats')
        .insert({
          company_id,
          type: 'company_chat',
          subject: 'Pojistné události',
          started_by: 'accountant',
          status: 'open',
          channel: 'claims',
          participants: [],
        })
        .select('id')
        .single()

      if (chatErr) throw chatErr
      chat = newChat
    }

    const { data: message, error: msgErr } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        chat_id: chat!.id,
        sender_id: userId,
        sender_name: senderName,
        sender_type: 'accountant',
        text: text.trim(),
        read: false,
      })
      .select()
      .single()

    if (msgErr) throw msgErr

    await supabaseAdmin
      .from('chats')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: text.trim().substring(0, 100),
        last_responder: 'accountant',
        waiting_since: null,
      })
      .eq('id', chat!.id)

    return NextResponse.json({
      message: {
        id: message.id,
        sender_name: message.sender_name,
        text: message.text,
        created_at: message.created_at,
        is_own: true,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[Claims messages] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
