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
    const { id: projectId } = await params

    // Get project hourly rate
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('hourly_rate')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('Error fetching project:', projectError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const hourlyRate = project?.hourly_rate || 1500

    // Get all tasks for this project
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('parent_project_id', projectId)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    const taskIds = tasks?.map(t => t.id) || []

    let totalBillableHours = 0
    let totalHours = 0

    if (taskIds.length > 0) {
      const { data: timeEntries, error: timeError } = await supabaseAdmin
        .from('time_tracking_entries')
        .select('duration_minutes, billable')
        .in('task_id', taskIds)

      if (!timeError && timeEntries) {
        for (const entry of timeEntries) {
          const hours = (entry.duration_minutes || 0) / 60
          totalHours += hours
          if (entry.billable) {
            totalBillableHours += hours
          }
        }
      }
    }

    let totalInvoiced = 0

    if (taskIds.length > 0) {
      const { data: invoices, error: invoiceError } = await supabaseAdmin
        .from('task_invoices')
        .select('total_amount')
        .in('task_id', taskIds)
        .in('status', ['sent', 'paid'])

      if (!invoiceError && invoices) {
        totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      }
    }

    const estimatedRevenue = totalBillableHours * hourlyRate
    const remaining = Math.max(0, estimatedRevenue - totalInvoiced)

    return NextResponse.json({
      total_hours: Math.round(totalHours * 100) / 100,
      total_billable_hours: Math.round(totalBillableHours * 100) / 100,
      hourly_rate: hourlyRate,
      estimated_revenue: Math.round(estimatedRevenue * 100) / 100,
      total_invoiced: Math.round(totalInvoiced * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
