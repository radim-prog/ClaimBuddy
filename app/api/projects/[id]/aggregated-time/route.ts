export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/projects/[id]/aggregated-time
 * Returns time_logs from the project itself + all subtasks, with task_title for each entry
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const projectId = params.id

    // Get subtask IDs + hourly_rate
    const { data: subtasks } = await supabaseAdmin
      .from('tasks')
      .select('id, title, hourly_rate')
      .eq('project_id', projectId)

    const taskTitleMap: Record<string, string> = {}
    const taskIds: string[] = []
    ;(subtasks || []).forEach(t => {
      taskTitleMap[t.id] = t.title
      taskIds.push(t.id)
    })

    // Also check parent_project_id subtasks
    const { data: subtasks2 } = await supabaseAdmin
      .from('tasks')
      .select('id, title, hourly_rate')
      .eq('parent_project_id', projectId)

    ;(subtasks2 || []).forEach(t => {
      if (!taskTitleMap[t.id]) {
        taskTitleMap[t.id] = t.title
        taskIds.push(t.id)
      }
    })

    // Include project itself + all subtasks
    const allIds = [projectId, ...taskIds]

    // Fetch time_logs
    const { data: timeLogs } = await supabaseAdmin
      .from('time_logs')
      .select('*')
      .in('task_id', allIds)
      .order('date', { ascending: false })

    const entries = (timeLogs || []).map(log => ({
      ...log,
      task_title: taskTitleMap[log.task_id] || null,
    }))

    const total_minutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
    const billable_minutes = entries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0)

    return NextResponse.json({
      entries,
      totals: { total_minutes, billable_minutes },
    })
  } catch (error: any) {
    console.error('Aggregated time error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
