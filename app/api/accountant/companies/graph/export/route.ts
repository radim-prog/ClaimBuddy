import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getActiveOwnership } from '@/lib/company-graph-store'
import { getFirmId } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

/**
 * GET /api/accountant/companies/graph/export?format=json|png|pdf
 * Export graph data as downloadable file
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const format = request.nextUrl.searchParams.get('format') || 'json'

  if (format === 'png' || format === 'pdf') {
    return NextResponse.json(
      { error: `Připravujeme export do ${format.toUpperCase()}. Zatím použijte JSON export.` },
      { status: 501 }
    )
  }

  if (format !== 'json') {
    return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 })
  }

  try {
    const firmId = getFirmId(request)

    // Fetch companies
    let companyQuery = supabaseAdmin
      .from('companies')
      .select('id, name, ico, dic, company_type, vat_payer, status, group_name, managing_director, address, has_employees, total_revenue, founded_date, holding_notes')
      .is('deleted_at', null)
      .order('name')

    if (firmId) {
      companyQuery = companyQuery.eq('firm_id', firmId)
    }

    const [companiesRes, ownership] = await Promise.all([
      companyQuery,
      getActiveOwnership(firmId),
    ])

    if (companiesRes.error) {
      throw new Error(`Failed to fetch companies: ${companiesRes.error.message}`)
    }

    // Fetch notes for all companies
    const companyIds = (companiesRes.data ?? []).map(c => c.id)
    const { data: notes } = await supabaseAdmin
      .from('company_notes')
      .select('*')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })

    const exportData = {
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      exported_by: userId,
      companies: companiesRes.data ?? [],
      ownership: ownership.map(o => ({
        parent_company_id: o.parent_company_id,
        child_company_id: o.child_company_id,
        share_percentage: o.share_percentage,
        relationship_type: o.relationship_type,
        valid_from: o.valid_from,
        notes: o.notes,
      })),
      notes: notes ?? [],
    }

    const json = JSON.stringify(exportData, null, 2)
    const filename = `company-universe-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[graph/export]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
