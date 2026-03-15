import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET — fetch client's onboarding questionnaire
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = request.nextUrl.searchParams.get('company_id')
  if (!companyId) return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })

  if (!(await canAccessCompany(userId, request.headers.get('x-user-role'), companyId, request.headers.get('x-impersonate-company')))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data } = await supabaseAdmin
    .from('onboarding_questionnaires')
    .select('*')
    .eq('company_id', companyId)
    .single()

  return NextResponse.json({ questionnaire: data || null })
}

// PATCH — save/submit responses
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, responses, status } = body

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Verify ownership via company_id
  const { data: existing } = await supabaseAdmin
    .from('onboarding_questionnaires')
    .select('company_id, status')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(await canAccessCompany(userId, request.headers.get('x-user-role'), existing.company_id, request.headers.get('x-impersonate-company')))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Don't allow editing if already reviewed
  if (existing.status === 'reviewed') {
    return NextResponse.json({ error: 'Questionnaire already reviewed' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {
    responses,
    status: status || 'in_progress',
    updated_at: new Date().toISOString(),
  }

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('onboarding_questionnaires')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questionnaire: data })
}
