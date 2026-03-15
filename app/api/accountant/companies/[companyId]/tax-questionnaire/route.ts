import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole, canAccessCompany } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET — accountant views client's questionnaire
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const impersonate = request.headers.get('x-impersonate-company')
  if (!(await canAccessCompany(userId!, userRole, params.companyId, impersonate))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  const { data, error } = await supabaseAdmin
    .from('tax_questionnaires')
    .select('*')
    .eq('company_id', params.companyId)
    .eq('year', parseInt(year))
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Fetch questionnaire error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }

  return NextResponse.json({ questionnaire: data || null })
}

// POST — accountant sends questionnaire to client
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const impersonate = request.headers.get('x-impersonate-company')
  if (!(await canAccessCompany(userId!, userRole, params.companyId, impersonate))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const year = body.year || new Date().getFullYear()

  const { data, error } = await supabaseAdmin
    .from('tax_questionnaires')
    .upsert({
      company_id: params.companyId,
      year,
      status: 'sent',
      responses: {},
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

// PATCH — accountant marks as reviewed
export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const impersonate = request.headers.get('x-impersonate-company')
  if (!(await canAccessCompany(userId!, userRole, params.companyId, impersonate))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const year = body.year || new Date().getFullYear()

  const { data, error } = await supabaseAdmin
    .from('tax_questionnaires')
    .update({
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
      notes: body.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', params.companyId)
    .eq('year', year)
    .select()
    .single()

  if (error) {
    console.error('Review questionnaire error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ questionnaire: data })
}
