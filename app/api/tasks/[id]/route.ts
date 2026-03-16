export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { UpdateTaskInput } from '@/lib/types/tasks'
import { isStaffRole } from '@/lib/access-check'

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

    // Get time entries from time_logs
    const { data: timeEntries } = await supabaseAdmin
      .from('time_logs')
      .select('*')
      .eq('task_id', taskId)
      .order('date', { ascending: false })

    // Get subtasks (always check, not just for is_project)
    const { data: subtasksData } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('parent_project_id', taskId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
    const subtasks = subtasksData

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

    const userRole = request.headers.get('x-user-role')
    if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

    // Allowlisted fields for update (prevents mass assignment)
    const ALLOWED_UPDATE_FIELDS = [
      'title', 'description', 'status',
      'is_project', 'project_outcome', 'parent_project_id',
      'score_money', 'score_fire', 'score_time', 'score_distance', 'score_personal',
      'assigned_to', 'assigned_to_name',
      'delegated_from', 'delegated_to', 'delegation_reason',
      'is_waiting_for', 'waiting_for_who', 'waiting_for_what',
      'accepted', 'accepted_at',
      'claimed_by', 'claimed_by_name', 'claimed_at',
      'due_date', 'due_time', 'estimated_minutes',
      'actual_minutes',
      'is_billable', 'hourly_rate',
      'gtd_context', 'gtd_energy_level', 'gtd_is_quick_action',
      'tags', 'progress_percentage', 'task_data',
      'position',
      'project_id', 'phase_id', 'location_id', 'position_in_phase', 'is_next_action',
      'company_id', 'company_name',
      'approved_by', 'approved_by_name', 'approved_at',
      'rejected_by', 'rejected_by_name', 'rejected_at', 'rejection_comment', 'rejection_count',
      'completed_at',
    ]

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const key of ALLOWED_UPDATE_FIELDS) {
      if (body[key as keyof typeof body] !== undefined) {
        updateData[key] = body[key as keyof typeof body]
      }
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

    const userRole = request.headers.get('x-user-role')
    if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

    // Soft delete - mark as cancelled + set deleted_at for trash
    const { data: task, error: deleteError } = await supabaseAdmin
      .from('tasks')
      .update({
        status: 'cancelled',
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
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
