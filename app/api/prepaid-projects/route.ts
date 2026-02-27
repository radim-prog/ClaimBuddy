import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET - list prepaid projects (optional filter: company_id, status)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('prepaid_projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (companyId) query = query.eq('company_id', companyId)
    if (status) {
      const statuses = status.split(',').map(s => s.trim())
      if (statuses.length > 1) {
        query = query.in('status', statuses)
      } else {
        query = query.eq('status', status)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching prepaid projects:', error)
      return NextResponse.json({ error: 'Failed to fetch prepaid projects' }, { status: 500 })
    }

    return NextResponse.json({ projects: data || [] })
  } catch (error) {
    console.error('Prepaid projects API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - create prepaid project
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()

    const ALLOWED_FIELDS = [
      'company_id', 'company_name', 'title', 'description',
      'estimated_hours', 'hourly_rate', 'travel_cost', 'other_costs',
      'notify_at_80', 'notify_at_100', 'budget_items',
    ] as const

    const projectData: Record<string, unknown> = {
      created_by: userId,
      status: 'draft',
      payment_status: 'pending',
    }

    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) projectData[key] = body[key]
    }

    // Validate required fields
    if (!projectData.company_id || !projectData.title || !projectData.estimated_hours) {
      return NextResponse.json(
        { error: 'company_id, title, and estimated_hours are required' },
        { status: 400 }
      )
    }

    // Calculate total budget
    const hours = Number(projectData.estimated_hours) || 0
    const rate = Number(projectData.hourly_rate) || 700
    const travel = Number(projectData.travel_cost) || 0
    const other = Number(projectData.other_costs) || 0
    projectData.total_budget = hours * rate + travel + other
    if (!projectData.hourly_rate) projectData.hourly_rate = rate

    const { data, error } = await supabaseAdmin
      .from('prepaid_projects')
      .insert(projectData)
      .select()
      .single()

    if (error) {
      console.error('Error creating prepaid project:', error)
      return NextResponse.json({ error: 'Failed to create prepaid project' }, { status: 500 })
    }

    return NextResponse.json({ success: true, project: data }, { status: 201 })
  } catch (error) {
    console.error('Prepaid projects POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
