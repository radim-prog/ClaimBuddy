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

    // Verify client access
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, company_id, client_visible, client_visible_tabs')
      .eq('id', id)
      .eq('is_case', true)
      .eq('client_visible', true)
      .single()

    if (!project) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

    // Verify company ownership FIRST (before tab access check)
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
      if (!company) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check tab access
    const tabs = Array.isArray(project.client_visible_tabs) ? (project.client_visible_tabs as string[]) : ['timeline', 'documents']
    if (!tabs.includes('documents')) {
      return NextResponse.json({ error: 'Documents not available' }, { status: 403 })
    }

    // Fetch only client-visible, current-version documents
    const { data, error } = await supabaseAdmin
      .from('case_documents')
      .select('id, name, file_url, file_type, file_size_bytes, category, version, description, uploaded_by_name, created_at')
      .eq('project_id', id)
      .eq('client_visible', true)
      .eq('is_current_version', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json({ documents: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
