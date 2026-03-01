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

    // Verify project is client_visible and belongs to client's company
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, company_id, client_visible, client_visible_tabs, hourly_rate')
      .eq('id', id)
      .eq('is_case', true)
      .eq('client_visible', true)
      .single()

    if (!project) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

    // Verify company ownership
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

    // Check budget tab access
    const tabs = Array.isArray(project.client_visible_tabs) ? (project.client_visible_tabs as string[]) : ['timeline', 'documents']
    if (!tabs.includes('budget')) {
      return NextResponse.json({ error: 'Budget not available' }, { status: 403 })
    }

    const hourlyRate = project.hourly_rate || 1500

    // Get tasks for this project
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('parent_project_id', id)

    const taskIds = tasks?.map(t => t.id) || []

    let totalBillableHours = 0
    if (taskIds.length > 0) {
      const { data: timeEntries } = await supabaseAdmin
        .from('time_tracking_entries')
        .select('duration_minutes, billable')
        .in('task_id', taskIds)

      if (timeEntries) {
        for (const entry of timeEntries) {
          if (entry.billable) {
            totalBillableHours += (entry.duration_minutes || 0) / 60
          }
        }
      }
    }

    let totalInvoiced = 0
    if (taskIds.length > 0) {
      const { data: invoices } = await supabaseAdmin
        .from('task_invoices')
        .select('total_amount')
        .in('task_id', taskIds)
        .in('status', ['sent', 'paid'])

      if (invoices) {
        totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      }
    }

    const estimatedRevenue = totalBillableHours * hourlyRate
    const remaining = Math.max(0, estimatedRevenue - totalInvoiced)

    // Return ONLY client-safe data (no hourly_rate, no hours)
    return NextResponse.json({
      estimated_revenue: Math.round(estimatedRevenue * 100) / 100,
      total_invoiced: Math.round(totalInvoiced * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
