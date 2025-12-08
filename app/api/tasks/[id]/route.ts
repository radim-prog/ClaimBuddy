import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { UpdateTaskInput } from '@/lib/types/tasks'

/**
 * GET /api/tasks/[id] - Get single task with full relations
 *
 * Returns task with:
 * - Checklist items
 * - Time tracking entries
 * - Subtasks (if project)
 * - Parent project (if subtask)
 */
export async function GET(
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

    // Get checklist items
    const { data: checklistItems } = await supabase
      .from('task_checklist_items')
      .select('*')
      .eq('task_id', taskId)
      .order('position', { ascending: true })

    // Get time tracking entries
    const { data: timeEntries } = await supabase
      .from('time_tracking_entries')
      .select('*')
      .eq('task_id', taskId)
      .order('started_at', { ascending: false })

    // Get subtasks (if this is a project)
    let subtasks = null
    if (task.is_project) {
      const { data: subtasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_project_id', taskId)
        .order('created_at', { ascending: true })
      subtasks = subtasksData
    }

    // Get parent project (if this is a subtask)
    let parentProject = null
    if (task.parent_project_id) {
      const { data: parentData } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', task.parent_project_id)
        .single()
      parentProject = parentData
    }

    // Construct full task response
    const taskWithRelations = {
      ...task,
      checklist_items: checklistItems || [],
      time_entries: timeEntries || [],
      subtasks: subtasks || [],
      parent_project: parentProject,
    }

    return NextResponse.json({ task: taskWithRelations })
  } catch (error: any) {
    console.error('GET task error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/tasks/[id] - Update task
 *
 * Body: Partial<UpdateTaskInput>
 * Returns: Updated task
 */
export async function PATCH(
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
    const body: Partial<UpdateTaskInput> = await request.json()

    // Check if task exists and user has permission
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Úkol nenalezen' }, { status: 404 })
      }
      console.error('Task fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Check permissions - user must be creator, assignee, or admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'accountant'
    const isCreator = existingTask.created_by === authUser.id
    const isAssignee = existingTask.assigned_to === authUser.id
    const isDelegatee = existingTask.delegated_to === authUser.id

    if (!isAdmin && !isCreator && !isAssignee && !isDelegatee) {
      return NextResponse.json(
        { error: 'Nemáte oprávnění k úpravě tohoto úkolu' },
        { status: 403 }
      )
    }

    // Update task
    const { data: task, error: updateError } = await supabase
      .from('tasks')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Task update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ task })
  } catch (error: any) {
    console.error('PATCH task error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/tasks/[id] - Delete task (soft delete)
 *
 * Sets completed_at if not already set, and status to 'cancelled'
 */
export async function DELETE(
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

    // Check if task exists and user has permission
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Úkol nenalezen' }, { status: 404 })
      }
      console.error('Task fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Check permissions - only creator or admin can delete
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'accountant'
    const isCreator = existingTask.created_by === authUser.id

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'Nemáte oprávnění ke smazání tohoto úkolu' },
        { status: 403 }
      )
    }

    // Soft delete - mark as cancelled
    const { data: task, error: deleteError } = await supabase
      .from('tasks')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single()

    if (deleteError) {
      console.error('Task delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      task,
      message: 'Úkol byl označen jako zrušený',
    })
  } catch (error: any) {
    console.error('DELETE task error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
