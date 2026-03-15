import { NextRequest, NextResponse } from 'next/server'
import {
  getConversationsByCompany,
  createConversation,
  getMessagesByChatId,
  addMessage,
  completeConversation,
  reopenConversation,
  markAllAsReadInChat,
  getUnreadCountByCompany,
} from '@/lib/message-store-db'
import { canAccessCompany } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

async function verifyCompanyAccess(request: NextRequest, companyId: string): Promise<boolean> {
  const userId = request.headers.get('x-user-id')!
  const userRole = request.headers.get('x-user-role')
  const impersonateCompany = request.headers.get('x-impersonate-company')
  return canAccessCompany(userId, userRole, companyId, impersonateCompany)
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const chatId = searchParams.get('chat_id')

    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    if (!await verifyCompanyAccess(request, companyId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (chatId) {
      // Get messages for a specific conversation + mark as read
      const messages = await getMessagesByChatId(chatId)
      await markAllAsReadInChat(chatId, 'client')
      return NextResponse.json({ messages })
    }

    // Get all conversations for this company
    const conversations = await getConversationsByCompany(companyId, 'client')
    const unread_count = await getUnreadCountByCompany(companyId, 'client')

    return NextResponse.json({ conversations, unread_count })
  } catch (error) {
    console.error('Client Messages API GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()

    // Create a new conversation
    if (body.action === 'create_conversation') {
      const { company_id, subject } = body
      if (!company_id || !subject?.trim()) {
        return NextResponse.json({ error: 'company_id and subject are required' }, { status: 400 })
      }
      if (!await verifyCompanyAccess(request, company_id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const conversation = await createConversation({
        company_id,
        subject: subject.trim(),
        started_by: 'client',
      })
      return NextResponse.json({ conversation })
    }

    // Send a message
    const { company_id, chat_id, content, sender_type, sender_name, attachments } = body
    if (!company_id || !chat_id || !sender_type || !sender_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    if (!await verifyCompanyAccess(request, company_id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const message = await addMessage({
      chat_id,
      company_id,
      sender_id: userId,
      content: content?.trim() || '',
      sender_type,
      sender_name,
      attachments,
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Client Messages API POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { action, chat_id, company_id } = body

    // Verify company access if company_id is provided
    if (company_id && !await verifyCompanyAccess(request, company_id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
        await markAllAsReadInChat(chat_id, 'client')
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Client Messages API PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
