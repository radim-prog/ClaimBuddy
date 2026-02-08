import { NextResponse } from 'next/server'
import {
  addMessage,
  getMessagesByCompany,
  getUnreadCountByCompany,
  markAllAsRead,
} from '@/lib/message-store-db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    const messages = await getMessagesByCompany(companyId)
    const unreadCount = await getUnreadCountByCompany(companyId, 'client')

    // Mark messages as read when client fetches them
    await markAllAsRead(companyId, 'client')

    return NextResponse.json({
      messages,
      unread_count: unreadCount,
    })
  } catch (error) {
    console.error('Messages API GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { company_id, content, sender_type, sender_name } = body

    if (!company_id || !content || !sender_type || !sender_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const message = await addMessage({
      company_id,
      content: content.trim(),
      sender_type,
      sender_name,
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Messages API POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
