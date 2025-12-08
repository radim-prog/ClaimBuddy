import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

/**
 * POST /api/tasks/[id]/accept - Accept delegated task
 *
 * Changes status to 'accepted' and sets accepted_at timestamp
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

    // Validate user is assigned to this task
    if (task.assigned_to !== authUser.id && task.delegated_to !== authUser.id) {
      return NextResponse.json(
        { error: 'Můžete přijmout pouze úkoly přiřazené vám' },
        { status: 403 }
      )
    }

    // Check if already accepted
    if (task.accepted) {
      return NextResponse.json(
        { error: 'Úkol již byl přijat', task },
        { status: 400 }
      )
    }

    // Accept task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'accepted',
        accepted: true,
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Task accept error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      task: updatedTask,
      message: 'Úkol byl úspěšně přijat',
    })
  } catch (error: any) {
    console.error('POST accept error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
