import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import type { CrisisIndustry, EmployeeRange } from '@/lib/types/crisis'

export const dynamic = 'force-dynamic'

// Helper: verify user can access the given company
async function canAccess(userId: string, userRole: string | null, companyId: string): Promise<boolean> {
  if (isStaffRole(userRole)) return true
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .single()
  return !!data
}

// GET /api/client/crisis-plan?company_id=xxx
// Returns crisis_plans + crisis_plan_risks for the given company
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRole = request.headers.get('x-user-role')
  const companyId = request.nextUrl.searchParams.get('company_id')

  if (!companyId) {
    return NextResponse.json({ error: 'Chybí parametr company_id' }, { status: 400 })
  }

  const allowed = await canAccess(userId, userRole, companyId)
  if (!allowed) {
    return NextResponse.json({ error: 'Přístup odmítnut' }, { status: 403 })
  }

  try {
    const { data: plans, error } = await supabase
      .from('crisis_plans')
      .select(`
        *,
        risks:crisis_plan_risks (
          id, plan_id, name, category, description,
          severity, occurrence, detection, rpn,
          action_immediate, action_preventive, early_warning,
          level_yellow, level_red, owner, sort_order, created_at
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ plans: plans ?? [] })
  } catch (error) {
    console.error('[Crisis Plan GET] Error:', error)
    return NextResponse.json({ error: 'Nepodařilo se načíst krizové plány' }, { status: 500 })
  }
}

// POST /api/client/crisis-plan
// Creates a draft crisis_plan
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRole = request.headers.get('x-user-role')

  let body: {
    company_id: string
    industry: CrisisIndustry
    employee_count_range: EmployeeRange
    annual_revenue_range?: string
    key_dependencies?: string
    biggest_fear?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Neplatné tělo požadavku' }, { status: 400 })
  }

  const { company_id, industry, employee_count_range, annual_revenue_range, key_dependencies, biggest_fear } = body

  if (!company_id || !industry || !employee_count_range) {
    return NextResponse.json(
      { error: 'Chybí povinné pole: company_id, industry nebo employee_count_range' },
      { status: 400 }
    )
  }

  const allowed = await canAccess(userId, userRole, company_id)
  if (!allowed) {
    return NextResponse.json({ error: 'Přístup odmítnut' }, { status: 403 })
  }

  try {
    const { data: plan, error } = await supabase
      .from('crisis_plans')
      .insert({
        company_id,
        created_by: userId,
        industry,
        employee_count_range,
        annual_revenue_range: annual_revenue_range ?? null,
        key_dependencies: key_dependencies ?? null,
        biggest_fear: biggest_fear ?? null,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    console.error('[Crisis Plan POST] Error:', error)
    return NextResponse.json({ error: 'Nepodařilo se vytvořit krizový plán' }, { status: 500 })
  }
}
