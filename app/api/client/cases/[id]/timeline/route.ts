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

    // Verify client access: project must be client_visible and belong to client's company
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, company_id, client_visible, client_visible_tabs')
      .eq('id', id)
      .eq('is_case', true)
      .eq('client_visible', true)
      .single()

    if (!project) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

    // Check tab access
    const tabs = (project.client_visible_tabs as string[]) || ['timeline', 'documents']
    if (!tabs.includes('timeline')) {
      return NextResponse.json({ error: 'Timeline not available' }, { status: 403 })
    }

    // Verify company ownership
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', project.company_id)
      .eq('owner_id', userId)
      .single()

    if (!company) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch only client-visible entries
    const { data, error } = await supabaseAdmin
      .from('case_timeline')
      .select('id, event_type, title, description, event_date, created_by_name, created_at')
      .eq('project_id', id)
      .eq('client_visible', true)
      .order('event_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 })
    }

    return NextResponse.json({ entries: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
