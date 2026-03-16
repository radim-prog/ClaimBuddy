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

  // Non-admin staff can only see inbox items for their assigned companies
  let allowedCompanyIds: string[] | null = null
  if (userRole !== 'admin') {
    const { data: assignedCompanies } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('assigned_accountant_id', userId)
      .is('deleted_at', null)
    allowedCompanyIds = (assignedCompanies || []).map(c => c.id)

    // If a specific companyId is requested, verify it is in the allowed set
    if (companyId && !allowedCompanyIds.includes(companyId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    let query = supabaseAdmin
      .from('document_inbox_items')
      .select('*, document_inboxes!inner(company_id, slug, email_address)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (companyId) {
      query = query.eq('company_id', companyId)
    } else if (allowedCompanyIds !== null) {
      // Scope to assigned companies for non-admin staff
      if (allowedCompanyIds.length === 0) {
        return NextResponse.json({ items: [], pendingCount: 0 })
      }
      query = query.in('company_id', allowedCompanyIds)
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

    // Get pending count for badge (scoped to the same company set)
    let pendingQuery = supabaseAdmin
      .from('document_inbox_items')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    if (companyId) {
      pendingQuery = pendingQuery.eq('company_id', companyId)
    } else if (allowedCompanyIds !== null && allowedCompanyIds.length > 0) {
      pendingQuery = pendingQuery.in('company_id', allowedCompanyIds)
    }
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
