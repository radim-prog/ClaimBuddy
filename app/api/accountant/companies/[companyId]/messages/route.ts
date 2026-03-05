import { NextRequest, NextResponse } from 'next/server'
import {
  getConversationsByCompany,
  createConversation,
  getMessagesByChatId,
  addMessage,
  completeConversation,
  reopenConversation,
  markAllAsReadInChat,
} from '@/lib/message-store-db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = await params
  const { searchParams } = new URL(request.url)
  const chatId = searchParams.get('chat_id')

  try {
    if (chatId) {
      // Get messages for a specific conversation
      const messages = await getMessagesByChatId(chatId)
      return NextResponse.json({ messages })
    }

    // Get all conversations for this company
    const conversations = await getConversationsByCompany(companyId, 'accountant')
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Messages API GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = await params
  const body = await request.json()

  try {
    // Create a new conversation
    if (body.action === 'create_conversation') {
      const { subject } = body
      if (!subject?.trim()) {
        return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
      }
      const conversation = await createConversation({
        company_id: companyId,
        subject: subject.trim(),
        started_by: 'accountant',
      })
      return NextResponse.json({ conversation })
    }

    // Send a message to a specific chat
    const { chat_id, content, sender_name } = body
    if (!chat_id) {
      return NextResponse.json({ error: 'chat_id is required' }, { status: 400 })
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const message = await addMessage({
      chat_id,
      company_id: companyId,
      sender_id: userId,
      sender_type: 'accountant',
      sender_name: sender_name || 'Účetní',
      content: content.trim(),
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Messages API POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action, chat_id } = body

  try {
    switch (action) {
      case 'complete_conversation':
        if (!chat_id) return NextResponse.json({ error: 'chat_id is required' }, { status: 400 })
        await completeConversation(chat_id)
        return NextResponse.json({ success: true })

      case 'reopen_conversation':
        if (!chat_id) return NextResponse.json({ error: 'chat_id is required' }, { status: 400 })
        await reopenConversation(chat_id)
        return NextResponse.json({ success: true })

      case 'mark_read':
        if (!chat_id) return NextResponse.json({ error: 'chat_id is required' }, { status: 400 })
        await markAllAsReadInChat(chat_id, 'accountant')
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Messages API PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
