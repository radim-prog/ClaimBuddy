export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

/**
 * PATCH /api/tasks/reorder - Bulk reorder subtasks
 *
 * Body: { parent_project_id: string, task_ids: string[] }
 * task_ids = array of subtask IDs in desired order
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const userRole = request.headers.get('x-user-role')
    if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { parent_project_id, task_ids } = await request.json()

    if (!parent_project_id || !Array.isArray(task_ids) || task_ids.length === 0) {
      return NextResponse.json(
        { error: 'parent_project_id a task_ids jsou povinné' },
        { status: 400 }
      )
    }

    // Update position for each task
    const updates = task_ids.map((id: string, index: number) =>
      supabaseAdmin
        .from('tasks')
        .update({ position: index, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('parent_project_id', parent_project_id)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Reorder tasks error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
