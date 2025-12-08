import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

/**
 * POST /api/tasks/[id]/delegate - Delegate task to another user
 *
 * Body: {
 *   delegated_to: string (user ID)
 *   delegated_to_name: string
 *   delegation_reason?: string
 * }
 *
 * Creates new task for delegate and updates original task status to 'waiting_for'
 * Returns: { original_task, delegated_task }
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
    const body = await request.json()
    const { delegated_to, delegated_to_name, delegation_reason } = body

    // Validate required fields
    if (!delegated_to || !delegated_to_name) {
      return NextResponse.json(
        { error: 'delegated_to a delegated_to_name jsou povinné' },
        { status: 400 }
      )
    }

    // Get original task
    const { data: originalTask, error: taskError } = await supabase
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

    // Validate user has permission to delegate (must be assigned to task or be creator)
    const isAssignee = originalTask.assigned_to === authUser.id
    const isCreator = originalTask.created_by === authUser.id

    if (!isAssignee && !isCreator) {
      return NextResponse.json(
        { error: 'Můžete delegovat pouze úkoly přiřazené vám nebo vytvořené vámi' },
        { status: 403 }
      )
    }

    // Validate delegate is different from current user
    if (delegated_to === authUser.id) {
      return NextResponse.json(
        { error: 'Nemůžete delegovat úkol sám sobě' },
        { status: 400 }
      )
    }

    // Verify delegated_to user exists
    const { data: delegatedUser, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', delegated_to)
      .single()

    if (userError || !delegatedUser) {
      return NextResponse.json(
        { error: 'Uživatel pro delegování nenalezen' },
        { status: 404 }
      )
    }

    // Create delegated task (copy of original)
    const delegatedTaskData = {
      title: originalTask.title,
      description: originalTask.description
        ? `${originalTask.description}\n\n---\nDelegováno od: ${authUser.user_metadata?.name || authUser.email}\nDůvod: ${delegation_reason || 'Není uveden'}`
        : `Delegováno od: ${authUser.user_metadata?.name || authUser.email}\nDůvod: ${delegation_reason || 'Není uveden'}`,
      is_project: originalTask.is_project,
      project_outcome: originalTask.project_outcome,
      parent_project_id: originalTask.parent_project_id,
      status: 'pending', // New task starts as pending
      priority: originalTask.priority,
      created_by: authUser.id,
      created_by_name: authUser.user_metadata?.name || authUser.email || 'Unknown',
      assigned_to: delegated_to,
      assigned_to_name: delegated_to_name,
      delegated_from: authUser.id,
      delegation_reason,
      due_date: originalTask.due_date,
      due_time: originalTask.due_time,
      company_id: originalTask.company_id,
      company_name: originalTask.company_name,
      monthly_closure_id: originalTask.monthly_closure_id,
      document_id: originalTask.document_id,
      onboarding_client_id: originalTask.onboarding_client_id,
      estimated_minutes: originalTask.estimated_minutes,
      is_billable: originalTask.is_billable,
      hourly_rate: originalTask.hourly_rate,
      gtd_context: originalTask.gtd_context,
      gtd_energy_level: originalTask.gtd_energy_level,
      gtd_is_quick_action: originalTask.gtd_is_quick_action,
      tags: originalTask.tags,
      task_data: originalTask.task_data,
    }

    const { data: delegatedTask, error: delegateError } = await supabase
      .from('tasks')
      .insert(delegatedTaskData)
      .select()
      .single()

    if (delegateError) {
      console.error('Delegated task creation error:', delegateError)
      return NextResponse.json({ error: delegateError.message }, { status: 500 })
    }

    // Update original task to waiting_for status
    const { data: updatedOriginalTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'waiting_for',
        delegated_to,
        delegation_reason,
        is_waiting_for: true,
        waiting_for_who: delegated_to_name,
        waiting_for_what: `Dokončení delegovaného úkolu: ${delegatedTask.id}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Original task update error:', updateError)
      // Try to rollback - delete the delegated task
      await supabase.from('tasks').delete().eq('id', delegatedTask.id)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      original_task: updatedOriginalTask,
      delegated_task: delegatedTask,
      message: `Úkol byl úspěšně delegován na ${delegated_to_name}`,
    }, { status: 201 })
  } catch (error: any) {
    console.error('POST delegate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
