import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    // Get project and verify client access
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('id, title, description, status, case_number, case_type_id, case_opened_at, case_closed_at, case_opposing_party, case_reference, client_visible, client_visible_tabs, company_id, created_at, updated_at')
      .eq('id', id)
      .eq('is_case', true)
      .eq('client_visible', true)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Verify company ownership (support impersonation)
    const impersonateCompany = request.headers.get('x-impersonate-company')
    if (impersonateCompany) {
      if (project.company_id !== impersonateCompany) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('id', project.company_id)
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .single()
      if (!company) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get case type name
    let caseTypeName = null
    if (project.case_type_id) {
      const { data: ct } = await supabaseAdmin
        .from('case_types')
        .select('name')
        .eq('id', project.case_type_id)
        .single()
      caseTypeName = ct?.name || null
    }

    return NextResponse.json({
      case: { ...project, case_type_name: caseTypeName },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
