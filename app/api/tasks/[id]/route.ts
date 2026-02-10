export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
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
    // Check authentication via header (custom HMAC auth)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const taskId = params.id

    // Get task
    const { data: task, error: taskError } = await supabaseAdmin
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
    const { data: checklistItems } = await supabaseAdmin
      .from('task_checklist_items')
      .select('*')
      .eq('task_id', taskId)
      .order('position', { ascending: true })

    // Get time tracking entries
    const { data: timeEntries } = await supabaseAdmin
      .from('time_tracking_entries')
      .select('*')
      .eq('task_id', taskId)
      .order('started_at', { ascending: false })

    // Get subtasks (if this is a project)
    let subtasks = null
    if (task.is_project) {
      const { data: subtasksData } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('parent_project_id', taskId)
        .order('created_at', { ascending: true })
      subtasks = subtasksData
    }

    // Get parent project (if this is a subtask)
    let parentProject = null
    if (task.parent_project_id) {
      const { data: parentData } = await supabaseAdmin
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
    // Check authentication via header (custom HMAC auth)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const taskId = params.id
    const body: Partial<UpdateTaskInput> = await request.json()

    // Check if task exists
    const { data: existingTask, error: fetchError } = await supabaseAdmin
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

    // Handle special case: status change to completed
    const updateData: Record<string, any> = {
      ...body,
      updated_at: new Date().toISOString(),
    }
    if (body.status === 'completed' && !existingTask.completed_at) {
      updateData.completed_at = new Date().toISOString()
    }
    if (body.status && body.status !== 'completed') {
      updateData.completed_at = null
    }

    // Update task
    const { data: task, error: updateError } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
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
    // Check authentication via header (custom HMAC auth)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const taskId = params.id

    // Check if task exists
    const { data: existingTask, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Úkol nenalezen' }, { status: 404 })
    }

    // Soft delete - mark as cancelled
    const { data: task, error: deleteError } = await supabaseAdmin
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
