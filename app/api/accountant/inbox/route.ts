import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || !isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '100')

  try {
    let query = supabaseAdmin
      .from('document_inbox_items')
      .select('*, document_inboxes!inner(company_id, slug, email_address)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error

    // Fetch company names for the global view
    const companyIds = [...new Set((data || []).map(d => d.company_id))]
    let companyMap: Record<string, string> = {}
    if (companyIds.length > 0) {
      const { data: companies } = await supabaseAdmin
        .from('companies')
        .select('id, name')
        .in('id', companyIds)
      companyMap = Object.fromEntries((companies || []).map(c => [c.id, c.name]))
    }

    // Get pending count for badge
    let pendingQuery = supabaseAdmin
      .from('document_inbox_items')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    if (companyId) pendingQuery = pendingQuery.eq('company_id', companyId)
    const { count: pendingCount } = await pendingQuery

    return NextResponse.json({
      items: (data || []).map(item => ({
        ...item,
        company_name: companyMap[item.company_id] || 'Neznámá firma',
      })),
      pendingCount: pendingCount || 0,
    })
  } catch (error) {
    console.error('Inbox fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
