import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/client/companies/graph
 * Read-only graph: client's own companies + ownership links between them
 * No health_score, no billing, no revenue data
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Fetch client's companies (same logic as /api/client/companies)
    const impersonateCompany = request.headers.get('x-impersonate-company')
    const userRole = request.headers.get('x-user-role')

    let companyQuery = supabaseAdmin
      .from('companies')
      .select('id, name, ico, dic, company_type, vat_payer, status, address, managing_director')
      .is('deleted_at', null)

    if (impersonateCompany) {
      companyQuery = companyQuery.eq('id', impersonateCompany)
    } else if (userRole === 'admin' || userRole === 'accountant') {
      companyQuery = companyQuery.eq('status', 'active').order('name')
    } else {
      companyQuery = companyQuery
        .eq('owner_id', userId)
        .in('status', ['active', 'pending_review', 'onboarding'])
        .order('name')
    }

    const { data: companies, error: compError } = await companyQuery
    if (compError) throw compError

    if (!companies || companies.length === 0) {
      return NextResponse.json({ companies: [], ownership: [] })
    }

    const companyIds = companies.map(c => c.id)

    // Fetch ownership links where BOTH sides are in client's companies
    const { data: allLinks, error: linkError } = await supabaseAdmin
      .from('company_ownership')
      .select('id, parent_company_id, child_company_id, share_percentage, relationship_type')
      .is('valid_to', null)
      .or(`parent_company_id.in.(${companyIds.join(',')}),child_company_id.in.(${companyIds.join(',')})`)

    if (linkError) throw linkError

    // Filter to only links where BOTH parent and child are in client's set
    const companyIdSet = new Set(companyIds)
    const ownership = (allLinks ?? []).filter(
      l => companyIdSet.has(l.parent_company_id) && companyIdSet.has(l.child_company_id)
    )

    // Map to client-safe format (no revenue, no reliability_score)
    const clientCompanies = companies.map(c => ({
      id: c.id,
      name: c.name,
      ico: c.ico,
      dic: c.dic,
      company_type: c.company_type || 'standalone',
      dph_status: c.vat_payer ? 'payer' : 'non_payer',
      status: c.status,
      address: c.address,
      managing_director: c.managing_director,
    }))

    return NextResponse.json({
      companies: clientCompanies,
      ownership: ownership.map(o => ({
        source: o.parent_company_id,
        target: o.child_company_id,
        share_percentage: o.share_percentage,
        relationship_type: o.relationship_type,
      })),
    })
  } catch (error) {
    console.error('[client/companies/graph GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
