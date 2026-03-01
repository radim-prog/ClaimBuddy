import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get companies assigned to this client
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('owner_id', userId)

    if (!companies || companies.length === 0) {
      return NextResponse.json({ cases: [] })
    }

    const companyIds = companies.map(c => c.id)

    // Get visible cases for these companies
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('id, title, status, case_number, case_type_id, case_opened_at, case_closed_at, case_opposing_party, client_visible_tabs, company_id, created_at, updated_at')
      .eq('is_case', true)
      .eq('client_visible', true)
      .in('company_id', companyIds)
      .neq('status', 'deleted')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching client cases:', error)
      return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
    }

    // Enrich with case type names
    const typeIds = [...new Set((data || []).map(c => c.case_type_id).filter(Boolean))]
    let caseTypes: Record<string, string> = {}
    if (typeIds.length > 0) {
      const { data: types } = await supabaseAdmin
        .from('case_types')
        .select('id, name')
        .in('id', typeIds)
      if (types) {
        caseTypes = Object.fromEntries(types.map(t => [t.id, t.name]))
      }
    }

    const cases = (data || []).map(c => ({
      ...c,
      case_type_name: c.case_type_id ? caseTypes[c.case_type_id] : null,
    }))

    return NextResponse.json({ cases })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
