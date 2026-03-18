import { NextRequest, NextResponse } from 'next/server'
import { getAllOpenConversations } from '@/lib/message-store-db'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getFirmId, getFirmCompanyIds } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as 'open' | 'completed' | null
  const unreadOnly = searchParams.get('unread_only') === 'true'
  const countOnly = searchParams.get('count_only') === 'true'
  const companyId = searchParams.get('company_id')
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
  const module = searchParams.get('module')

  const firmId = getFirmId(request)
  const firmCompanyIds = firmId ? await getFirmCompanyIds(firmId) : undefined

  try {
    const result = await getAllOpenConversations(userId, {
      status: status || undefined,
      unread_only: unreadOnly,
      limit: limit || 100,
      count_only: countOnly,
      company_id: companyId || undefined,
      firm_company_ids: firmCompanyIds,
    })

    // Claims module filter: only conversations for companies with insurance cases
    if (module === 'claims' && !countOnly && result.conversations) {
      const { data: claimsCompanyIds } = await supabaseAdmin
        .from('insurance_cases')
        .select('company_id')
      const claimsSet = new Set((claimsCompanyIds || []).map((r: { company_id: string }) => r.company_id))
      result.conversations = result.conversations.filter(
        (c: { company_id: string }) => claimsSet.has(c.company_id)
      )
      result.total_unread = result.conversations.filter(
        (c: { unread_count?: number }) => (c.unread_count || 0) > 0
      ).length
    }

    if (countOnly) {
      return NextResponse.json({
        total_unread: result.total_unread,
        needs_response: (result as any).needs_response ?? 0,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Conversations API GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
