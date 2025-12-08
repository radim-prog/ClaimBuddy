import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { CreateTimeTrackingInput } from '@/lib/types/tasks'

/**
 * POST /api/tasks/[id]/time-tracking - Create time entry
 *
 * Body: CreateTimeTrackingInput
 * Auto-updates task actual_minutes via trigger
 * Returns: Created entry
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
    const body: CreateTimeTrackingInput = await request.json()

    // Validate task exists
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

    // Validate user has access to this task
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
        { error: 'Nemáte oprávnění k logování času pro tento úkol' },
        { status: 403 }
      )
    }

    // Validate required fields
    if (!body.started_at) {
      return NextResponse.json(
        { error: 'started_at je povinné pole' },
        { status: 400 }
      )
    }

    // If stopped_at is not provided, this is a "start tracking" request
    const isStartTracking = !body.stopped_at

    // Create time tracking entry
    const entryData = {
      task_id: taskId,
      user_id: authUser.id,
      user_name: authUser.user_metadata?.name || authUser.email || 'Unknown',
      started_at: body.started_at,
      stopped_at: body.stopped_at || null,
      note: body.note || null,
      billable: body.billable !== undefined ? body.billable : task.is_billable,
    }

    const { data: entry, error: entryError } = await supabase
      .from('time_tracking_entries')
      .insert(entryData)
      .select()
      .single()

    if (entryError) {
      console.error('Time tracking entry creation error:', entryError)
      return NextResponse.json({ error: entryError.message }, { status: 500 })
    }

    // If this is a start tracking request, update task status
    if (isStartTracking) {
      await supabase
        .from('tasks')
        .update({
          time_tracking_started_at: body.started_at,
          status: task.status === 'accepted' || task.status === 'pending' ? 'in_progress' : task.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
    }

    // Get updated task to return current actual_minutes (updated by trigger)
    const { data: updatedTask } = await supabase
      .from('tasks')
      .select('actual_minutes, billable_hours')
      .eq('id', taskId)
      .single()

    return NextResponse.json({
      entry,
      task_actual_minutes: updatedTask?.actual_minutes || 0,
      task_billable_hours: updatedTask?.billable_hours || 0,
      message: isStartTracking
        ? 'Měření času zahájeno'
        : 'Čas úspěšně zalogován',
    }, { status: 201 })
  } catch (error: any) {
    console.error('POST time tracking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/tasks/[id]/time-tracking - Get all time entries for task
 *
 * Returns: Array of time tracking entries
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

    // Validate task exists and user has access
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

    // Get all time tracking entries
    const { data: entries, error: entriesError } = await supabase
      .from('time_tracking_entries')
      .select('*')
      .eq('task_id', taskId)
      .order('started_at', { ascending: false })

    if (entriesError) {
      console.error('Time entries fetch error:', entriesError)
      return NextResponse.json({ error: entriesError.message }, { status: 500 })
    }

    // Calculate totals
    const totalDuration = entries?.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) || 0
    const billableDuration = entries?.reduce(
      (sum, entry) => sum + (entry.billable ? (entry.duration_minutes || 0) : 0),
      0
    ) || 0

    return NextResponse.json({
      entries: entries || [],
      total_duration: totalDuration,
      billable_duration: billableDuration,
    })
  } catch (error: any) {
    console.error('GET time tracking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/tasks/[id]/time-tracking - Update running time entry (stop timer)
 *
 * Body: { entry_id: string, stopped_at: string, note?: string }
 * Returns: Updated entry
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
    const body = await request.json()
    const { entry_id, stopped_at, note } = body

    if (!entry_id || !stopped_at) {
      return NextResponse.json(
        { error: 'entry_id a stopped_at jsou povinné' },
        { status: 400 }
      )
    }

    // Validate entry exists and belongs to user
    const { data: entry, error: entryError } = await supabase
      .from('time_tracking_entries')
      .select('*')
      .eq('id', entry_id)
      .eq('task_id', taskId)
      .single()

    if (entryError) {
      if (entryError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Záznam nenalezen' }, { status: 404 })
      }
      console.error('Entry fetch error:', entryError)
      return NextResponse.json({ error: entryError.message }, { status: 500 })
    }

    if (entry.user_id !== authUser.id) {
      return NextResponse.json(
        { error: 'Nemáte oprávnění upravit tento záznam' },
        { status: 403 }
      )
    }

    // Update entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from('time_tracking_entries')
      .update({
        stopped_at,
        note: note || entry.note,
      })
      .eq('id', entry_id)
      .select()
      .single()

    if (updateError) {
      console.error('Entry update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Clear time_tracking_started_at on task
    await supabase
      .from('tasks')
      .update({
        time_tracking_started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // Get updated task totals
    const { data: updatedTask } = await supabase
      .from('tasks')
      .select('actual_minutes, billable_hours')
      .eq('id', taskId)
      .single()

    return NextResponse.json({
      entry: updatedEntry,
      task_actual_minutes: updatedTask?.actual_minutes || 0,
      task_billable_hours: updatedTask?.billable_hours || 0,
      message: 'Měření času ukončeno',
    })
  } catch (error: any) {
    console.error('PATCH time tracking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
