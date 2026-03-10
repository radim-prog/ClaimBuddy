export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/projects/[id]/aggregated-docs
 * Returns document_links from the project itself + all its subtasks
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

    // Get subtask IDs
    const { data: subtasks } = await supabaseAdmin
      .from('tasks')
      .select('id, title')
      .eq('project_id', projectId)

    const taskIds = (subtasks || []).map(t => t.id)
    const taskTitleMap: Record<string, string> = {}
    ;(subtasks || []).forEach(t => { taskTitleMap[t.id] = t.title })

    // Also check parent_project_id subtasks
    const { data: subtasks2 } = await supabaseAdmin
      .from('tasks')
      .select('id, title')
      .eq('parent_project_id', projectId)

    ;(subtasks2 || []).forEach(t => {
      if (!taskTitleMap[t.id]) {
        taskIds.push(t.id)
        taskTitleMap[t.id] = t.title
      }
    })

    // All entity IDs to search
    const allIds = [projectId, ...taskIds]

    // Fetch document_links
    const { data: links } = await supabaseAdmin
      .from('document_links')
      .select('*, document:documents(*)')
      .in('entity_id', allIds)

    const documents = (links || []).map(link => ({
      ...link,
      source_task_title: link.entity_id !== projectId
        ? taskTitleMap[link.entity_id] || null
        : null,
    }))

    return NextResponse.json({ documents })
  } catch (error: any) {
    console.error('Aggregated docs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
