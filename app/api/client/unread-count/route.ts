import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get user's companies
    const { data: userCompanies } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('user_id', userId)

    const companyIds = (userCompanies || []).map(c => c.id)
    if (companyIds.length === 0) {
      return NextResponse.json({ total: 0, per_company: {} })
    }

    // Get all chats for these companies
    const { data: chats } = await supabaseAdmin
      .from('chats')
      .select('id, company_id')
      .in('company_id', companyIds)
      .eq('type', 'company_chat')

    if (!chats || chats.length === 0) {
      return NextResponse.json({ total: 0, per_company: {} })
    }

    // Count unread messages (from accountant, not read by client)
    const chatIds = chats.map(c => c.id)
    const { data: unreadMessages } = await supabaseAdmin
      .from('chat_messages')
      .select('chat_id')
      .in('chat_id', chatIds)
      .eq('sender_type', 'accountant')
      .eq('read', false)

    // Build per-company counts
    const chatToCompany = new Map(chats.map(c => [c.id, c.company_id]))
    const perCompany: Record<string, number> = {}
    let total = 0

    for (const msg of unreadMessages || []) {
      const companyId = chatToCompany.get(msg.chat_id)
      if (companyId) {
        perCompany[companyId] = (perCompany[companyId] || 0) + 1
        total++
      }
    }

    return NextResponse.json({ total, per_company: perCompany })
  } catch (err) {
    console.error('GET unread-count error:', err)
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 })
  }
}
