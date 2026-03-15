import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET — fetch questionnaire for company+year
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  if (!companyId) {
    return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
  }

  const userRole = request.headers.get('x-user-role')
  const impersonate = request.headers.get('x-impersonate-company')
  if (!(await canAccessCompany(userId, userRole, companyId, impersonate))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('tax_questionnaires')
    .select('*')
    .eq('company_id', companyId)
    .eq('year', parseInt(year))
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Fetch questionnaire error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }

  return NextResponse.json({ questionnaire: data || null })
}

// POST — create questionnaire (accountant sends to client)
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { company_id, year } = body

  if (!company_id || !year) {
    return NextResponse.json({ error: 'company_id and year are required' }, { status: 400 })
  }

  const impersonate = request.headers.get('x-impersonate-company')
  if (!(await canAccessCompany(userId, userRole, company_id, impersonate))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Accountants create with status 'sent', clients with 'in_progress'
  const isStaff = userRole === 'accountant' || userRole === 'admin' || userRole === 'assistant'
  const status = isStaff ? 'sent' : 'in_progress'

  const { data, error } = await supabaseAdmin
    .from('tax_questionnaires')
    .upsert({
      company_id,
      year,
      status,
      responses: body.responses || {},
      created_by: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,year' })
    .select()
    .single()

  if (error) {
    console.error('Create questionnaire error:', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }

  return NextResponse.json({ questionnaire: data }, { status: 201 })
}

// PATCH — update responses (client fills in)
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, responses, status } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // Verify access via company_id
  const { data: existing } = await supabaseAdmin
    .from('tax_questionnaires')
    .select('company_id, status')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const userRole = request.headers.get('x-user-role')
  const impersonate = request.headers.get('x-impersonate-company')
  if (!(await canAccessCompany(userId, userRole, existing.company_id, impersonate))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (responses !== undefined) update.responses = responses
  if (status === 'completed') {
    update.status = 'completed'
    update.completed_at = new Date().toISOString()
  } else if (status === 'in_progress') {
    update.status = 'in_progress'
  } else if (status === 'reviewed') {
    update.status = 'reviewed'
    update.reviewed_at = new Date().toISOString()
    update.reviewed_by = userId
  }

  const { data, error } = await supabaseAdmin
    .from('tax_questionnaires')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Update questionnaire error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ questionnaire: data })
}
