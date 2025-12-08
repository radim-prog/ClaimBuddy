import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

/**
 * POST /api/tasks/[id]/complete - Mark task as complete
 *
 * Updates status to 'completed' and records completed_at timestamp
 * If is_billable and not yet invoiced, calculates billable amount
 * Returns: Updated task
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Check authentication
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const taskId = params.id

    // Get task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError) {
      if (taskError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Úkol nenalezen' }, { status: 404 })
      }
      console.error('Task fetch error:', taskError)
      return NextResponse.json({ error: taskError.message }, { status: 500 })
    }

    // Validate user has permission to complete (assigned user, delegated user, or creator)
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'accountant'
    const isAssignee = task.assigned_to === authUser.id
    const isDelegatee = task.delegated_to === authUser.id
    const isCreator = task.created_by === authUser.id

    if (!isAdmin && !isAssignee && !isDelegatee && !isCreator) {
      return NextResponse.json(
        { error: 'Nemáte oprávnění k dokončení tohoto úkolu' },
        { status: 403 }
      )
    }

    // Check if already completed
    if (task.status === 'completed') {
      return NextResponse.json(
        { error: 'Úkol již byl dokončen', task },
        { status: 400 }
      )
    }

    // If this is a project, check if all subtasks are completed
    if (task.is_project) {
      const { data: subtasks } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('parent_project_id', taskId)

      const hasIncompleteSubtasks = subtasks?.some(
        subtask => subtask.status !== 'completed' && subtask.status !== 'cancelled'
      )

      if (hasIncompleteSubtasks) {
        return NextResponse.json(
          {
            error: 'Nemůžete dokončit projekt, dokud nejsou dokončeny všechny dílčí úkoly',
            incomplete_subtasks: subtasks?.filter(
              s => s.status !== 'completed' && s.status !== 'cancelled'
            ).length,
          },
          { status: 400 }
        )
      }
    }

    const now = new Date().toISOString()

    // Update task to completed
    const updateData: any = {
      status: 'completed',
      completed_at: now,
      updated_at: now,
    }

    // If there's a running time tracking entry, stop it
    if (task.time_tracking_started_at) {
      const { data: runningEntry } = await supabase
        .from('time_tracking_entries')
        .select('*')
        .eq('task_id', taskId)
        .is('stopped_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (runningEntry) {
        await supabase
          .from('time_tracking_entries')
          .update({ stopped_at: now })
          .eq('id', runningEntry.id)
      }

      updateData.time_tracking_started_at = null
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Task complete error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If this task was delegated from another task, update the parent
    if (task.delegated_from) {
      // Find the original task that delegated this one
      const { data: parentTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('delegated_to', authUser.id)
        .eq('status', 'waiting_for')
        .contains('waiting_for_what', taskId)

      if (parentTasks && parentTasks.length > 0) {
        // Update parent task - remove waiting status
        await supabase
          .from('tasks')
          .update({
            status: 'accepted',
            is_waiting_for: false,
            waiting_for_who: null,
            waiting_for_what: null,
            updated_at: now,
          })
          .eq('id', parentTasks[0].id)
      }
    }

    // Build response message
    let message = 'Úkol byl úspěšně dokončen'
    if (updatedTask.is_billable && updatedTask.billable_hours > 0) {
      const billableAmount = updatedTask.billable_hours * (updatedTask.hourly_rate || 0)
      message += ` | Fakturovatelná částka: ${billableAmount.toFixed(2)} Kč (${updatedTask.billable_hours.toFixed(2)}h × ${updatedTask.hourly_rate} Kč/h)`
    }

    return NextResponse.json({
      task: updatedTask,
      message,
      billable_summary: updatedTask.is_billable ? {
        hours: updatedTask.billable_hours,
        rate: updatedTask.hourly_rate,
        amount: updatedTask.billable_hours * (updatedTask.hourly_rate || 0),
      } : null,
    })
  } catch (error: any) {
    console.error('POST complete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
