import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { CreateTaskInput, TaskFilter } from '@/lib/types/tasks'

/**
 * GET /api/tasks - List tasks with filters
 *
 * Query params:
 * - status: TaskStatus (can be comma-separated for multiple)
 * - score_priority: ScorePriority (high|medium|low, derived from R-Tasks score)
 * - assigned_to: UUID
 * - created_by: UUID
 * - company_id: UUID
 * - is_project: boolean
 * - is_billable: boolean
 * - gtd_context: string (can be comma-separated for multiple)
 * - gtd_energy_level: 'high' | 'medium' | 'low'
 * - gtd_is_quick_action: boolean
 * - due_date_from: DATE
 * - due_date_to: DATE
 * - parent_project_id: UUID
 * - search: string (searches title and description)
 * - sort_by: field to sort by (default: created_at)
 * - sort_order: 'asc' | 'desc' (default: desc)
 * - page: number (default: 1)
 * - page_size: number (default: 50, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication via middleware header
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const supabase = createServerClient()

    // Parse query parameters
    const { searchParams } = new URL(request.url)

    // count_only mode: return just the count
    const countOnly = searchParams.get('count_only') === 'true'

    const filters: TaskFilter = {
      status: searchParams.get('status')?.split(',') as any,
      score_priority: searchParams.get('score_priority')?.split(',') as any,
      assigned_to: searchParams.get('assigned_to') || undefined,
      created_by: searchParams.get('created_by') || undefined,
      company_id: searchParams.get('company_id') || undefined,
      is_project: searchParams.get('is_project') === 'true' ? true :
                   searchParams.get('is_project') === 'false' ? false : undefined,
      is_billable: searchParams.get('is_billable') === 'true' ? true :
                    searchParams.get('is_billable') === 'false' ? false : undefined,
      gtd_context: searchParams.get('gtd_context')?.split(','),
      gtd_energy_level: searchParams.get('gtd_energy_level') as any,
      gtd_is_quick_action: searchParams.get('gtd_is_quick_action') === 'true' ? true :
                            searchParams.get('gtd_is_quick_action') === 'false' ? false : undefined,
      due_date_from: searchParams.get('due_date_from') || undefined,
      due_date_to: searchParams.get('due_date_to') || undefined,
      parent_project_id: searchParams.get('parent_project_id') || undefined,
      search: searchParams.get('search') || undefined,
    }

    // GTD-specific filters
    const projectId = searchParams.get('project_id')
    const locationId = searchParams.get('location_id')
    const isNextAction = searchParams.get('is_next_action')

    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = Math.min(parseInt(searchParams.get('page_size') || '50', 10), 100)

    // Build query
    let query = supabase
      .from('tasks')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }

    // Note: priority filtering is done in the client via score_priority
    // The R-Tasks score is calculated from multiple score fields, not a direct DB column

    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by)
    }

    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id)
    }

    if (filters.is_project !== undefined) {
      query = query.eq('is_project', filters.is_project)
    }

    if (filters.is_billable !== undefined) {
      query = query.eq('is_billable', filters.is_billable)
    }

    if (filters.gtd_context && filters.gtd_context.length > 0) {
      query = query.overlaps('gtd_context', filters.gtd_context)
    }

    if (filters.gtd_energy_level) {
      query = query.eq('gtd_energy_level', filters.gtd_energy_level)
    }

    if (filters.gtd_is_quick_action !== undefined) {
      query = query.eq('gtd_is_quick_action', filters.gtd_is_quick_action)
    }

    if (filters.due_date_from) {
      query = query.gte('due_date', filters.due_date_from)
    }

    if (filters.due_date_to) {
      query = query.lte('due_date', filters.due_date_to)
    }

    if (filters.parent_project_id) {
      query = query.eq('parent_project_id', filters.parent_project_id)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (isNextAction === 'true') {
      query = query.eq('is_next_action', true)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: tasks, error, count } = await query

    if (error) {
      console.error('Tasks fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (countOnly) {
      return NextResponse.json({ count: count || 0 })
    }

    return NextResponse.json({
      tasks: tasks || [],
      total: count || 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('GET tasks error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/tasks - Create new task
 *
 * Body: CreateTaskInput
 * Returns: Created task with ID
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication via middleware header
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const supabase = createServerClient()

    const body: CreateTaskInput = await request.json()

    // Validate required fields - company not required for inbox tasks
    if (!body.title) {
      return NextResponse.json(
        { error: 'Název úkolu je povinný' },
        { status: 400 }
      )
    }

    // Quick actions (<30 min) don't require R-Tasks scores
    const isQuickAction = body.gtd_is_quick_action || (body.estimated_minutes && body.estimated_minutes <= 30)

    const taskData = {
      ...body,
      created_by: userId,
      created_by_name: body.created_by_name || request.headers.get('x-user-name') || '',
      // Set defaults if not provided
      status: body.status || 'pending',
      is_project: body.is_project || false,
      is_billable: body.is_billable || false,
      gtd_is_quick_action: isQuickAction,
      progress_percentage: 0,
      actual_minutes: 0,
      billable_hours: 0,
      invoiced_amount: 0,
      // R-Tasks default scores (only for non-quick actions)
      ...(isQuickAction ? {} : {
        score_money: body.score_money ?? 1,
        score_fire: body.score_fire ?? 1,
        score_time: body.score_time ?? 1,
        score_distance: body.score_distance ?? 2,
        score_personal: body.score_personal ?? 0,
      }),
    }

    // Create task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single()

    if (taskError) {
      console.error('Task creation error:', taskError)
      return NextResponse.json({ error: taskError.message }, { status: 500 })
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error: any) {
    console.error('POST task error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
