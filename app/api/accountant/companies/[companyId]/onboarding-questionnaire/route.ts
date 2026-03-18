import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole, canAccessCompany } from '@/lib/access-check'
import { getFirmId, verifyCompanyAccess } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ companyId: string }> }

// GET — fetch onboarding questionnaire for a company
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { companyId } = await params

  const firmId = getFirmId(request)
  if (!await verifyCompanyAccess(companyId, firmId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const impersonate = request.headers.get('x-impersonate-company')
  if (!(await canAccessCompany(userId!, userRole, companyId, impersonate))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data } = await supabaseAdmin
    .from('onboarding_questionnaires')
    .select('*')
    .eq('company_id', companyId)
    .single()

  return NextResponse.json({ questionnaire: data || null })
}

// POST — create/send onboarding questionnaire to client
export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { companyId } = await params

  const firmId = getFirmId(request)
  if (!await verifyCompanyAccess(companyId, firmId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const impersonate = request.headers.get('x-impersonate-company')
  if (!(await canAccessCompany(userId!, userRole, companyId, impersonate))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if one already exists
  const { data: existing } = await supabaseAdmin
    .from('onboarding_questionnaires')
    .select('id')
    .eq('company_id', companyId)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Questionnaire already exists' }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin
    .from('onboarding_questionnaires')
    .insert({
      company_id: companyId,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questionnaire: data })
}

// PATCH — mark as reviewed
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { companyId } = await params

  const firmId = getFirmId(request)
  if (!await verifyCompanyAccess(companyId, firmId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const impersonate = request.headers.get('x-impersonate-company')
  if (!(await canAccessCompany(userId!, userRole, companyId, impersonate))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('onboarding_questionnaires')
    .update({
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .eq('status', 'completed')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found or not in completed status' }, { status: 404 })
  return NextResponse.json({ questionnaire: data })
}
