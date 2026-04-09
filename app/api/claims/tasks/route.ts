import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { getUserName } from '@/lib/request-utils'

export const dynamic = 'force-dynamic'

// GET /api/claims/tasks?company_id=<uuid>
// Returns tasks for a specific company (claims context)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  if (!companyId) return NextResponse.json({ error: 'company_id is required' }, { status: 400 })

  try {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('id, title, description, status, due_date, assigned_to, assigned_to_name, priority, company_id, created_at')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ tasks: data ?? [] })
  } catch (error) {
    console.error('[Claims tasks] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/claims/tasks — create a task linked to a company
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { company_id, title, description, priority, due_date } = body

    if (!company_id || !title) {
      return NextResponse.json({ error: 'company_id and title are required' }, { status: 400 })
    }

    const userName = getUserName(request, 'Účetní')

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('name')
      .eq('id', company_id)
      .maybeSingle()

    if (companyError) throw companyError
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        company_id,
        title,
        description: description?.trim() || null,
        status: 'pending',
        priority: priority || 'medium',
        due_date: due_date || null,
        assigned_to: userId,
        assigned_to_name: userName,
        created_by: userId,
        created_by_name: userName,
        company_name: company.name,
        source: 'claims',
        progress_percentage: 0,
        actual_minutes: 0,
        billable_hours: 0,
        invoiced_amount: 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ task: data }, { status: 201 })
  } catch (error) {
    console.error('[Claims tasks] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
