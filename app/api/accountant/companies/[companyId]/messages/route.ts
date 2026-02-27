import { NextRequest, NextResponse } from 'next/server'
import { getMessagesByCompany, addMessage, markAllAsRead } from '@/lib/message-store-db'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
  const messages = await getMessagesByCompany(companyId)

  return NextResponse.json({ messages })
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
  const { content, sender_name } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const message = await addMessage({
    company_id: companyId,
    sender_id: userId,
    sender_type: 'accountant',
    sender_name: sender_name || 'Účetní',
    content: content.trim(),
  })

  return NextResponse.json({ message })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = await params

  // Mark all client messages as read for accountant
  await markAllAsRead(companyId, 'accountant')

  return NextResponse.json({ success: true })
}
