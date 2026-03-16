import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import type { CrisisPlanStatus, CrisisPlanRisk } from '@/lib/types/crisis'

export const dynamic = 'force-dynamic'

// Helper: verify user can access the given company
async function canAccessCompany(userId: string, userRole: string | null, companyId: string): Promise<boolean> {
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

// Helper: load plan and verify access, returns plan or null with an error response
async function loadAndAuthorize(
  planId: string,
  userId: string,
  userRole: string | null
): Promise<{ plan: Record<string, unknown>; error?: never } | { plan?: never; error: NextResponse }> {
  const { data: plan, error } = await supabase
    .from('crisis_plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (error || !plan) {
    return { error: NextResponse.json({ error: 'Krizový plán nenalezen' }, { status: 404 }) }
  }

  const allowed = await canAccessCompany(userId, userRole, plan.company_id as string)
  if (!allowed) {
    return { error: NextResponse.json({ error: 'Přístup odmítnut' }, { status: 403 }) }
  }

  return { plan }
}

// GET /api/client/crisis-plan/[planId]
// Returns plan detail with risks
export async function GET(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRole = request.headers.get('x-user-role')
  const { planId } = params

  const auth = await loadAndAuthorize(planId, userId, userRole)
  if (auth.error) return auth.error

  try {
    const { data: risks, error: risksError } = await supabase
      .from('crisis_plan_risks')
      .select('*')
      .eq('plan_id', planId)
      .order('sort_order', { ascending: true })

    if (risksError) throw risksError

    return NextResponse.json({ plan: { ...auth.plan, risks: risks ?? [] } })
  } catch (error) {
    console.error('[Crisis Plan GET detail] Error:', error)
    return NextResponse.json({ error: 'Nepodařilo se načíst detail plánu' }, { status: 500 })
  }
}

// PATCH /api/client/crisis-plan/[planId]
// Updates plan fields or replaces risks
export async function PATCH(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRole = request.headers.get('x-user-role')
  const { planId } = params

  const auth = await loadAndAuthorize(planId, userId, userRole)
  if (auth.error) return auth.error

  let body: {
    status?: CrisisPlanStatus
    industry?: string
    employee_count_range?: string
    annual_revenue_range?: string
    key_dependencies?: string
    biggest_fear?: string
    risks?: Partial<CrisisPlanRisk>[]
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Neplatné tělo požadavku' }, { status: 400 })
  }

  const { risks, ...planFields } = body

  try {
    const now = new Date().toISOString()
    let updatedPlan: Record<string, unknown> = auth.plan

    // Update plan metadata fields if present
    if (Object.keys(planFields).length > 0) {
      const { data, error } = await supabase
        .from('crisis_plans')
        .update({ ...planFields, updated_at: now })
        .eq('id', planId)
        .select()
        .single()

      if (error) throw error
      updatedPlan = data
    }

    // Replace risks if provided
    let updatedRisks: unknown[] | undefined
    if (risks && risks.length > 0) {
      const { error: deleteError } = await supabase
        .from('crisis_plan_risks')
        .delete()
        .eq('plan_id', planId)

      if (deleteError) throw deleteError

      const riskRows = risks.map((r, idx) => ({
        plan_id: planId,
        name: r.name,
        category: r.category ?? 'operational',
        description: r.description ?? null,
        severity: r.severity ?? 5,
        occurrence: r.occurrence ?? 5,
        detection: r.detection ?? 5,
        rpn: (r.severity ?? 5) * (r.occurrence ?? 5) * (r.detection ?? 5),
        action_immediate: r.action_immediate ?? null,
        action_preventive: r.action_preventive ?? null,
        early_warning: r.early_warning ?? null,
        level_yellow: r.level_yellow ?? null,
        level_red: r.level_red ?? null,
        owner: r.owner ?? null,
        sort_order: r.sort_order ?? idx,
      }))

      const { data: inserted, error: insertError } = await supabase
        .from('crisis_plan_risks')
        .insert(riskRows)
        .select()

      if (insertError) throw insertError
      updatedRisks = inserted
    }

    return NextResponse.json({
      plan: updatedPlan,
      ...(updatedRisks ? { risks: updatedRisks } : {}),
    })
  } catch (error) {
    console.error('[Crisis Plan PATCH] Error:', error)
    return NextResponse.json({ error: 'Nepodařilo se aktualizovat krizový plán' }, { status: 500 })
  }
}

// DELETE /api/client/crisis-plan/[planId]
// Deletes plan + CASCADE risks (only draft or generated status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRole = request.headers.get('x-user-role')
  const { planId } = params

  const auth = await loadAndAuthorize(planId, userId, userRole)
  if (auth.error) return auth.error

  const plan = auth.plan
  const status = plan.status as string
  if (status !== 'draft' && status !== 'generated') {
    return NextResponse.json(
      { error: 'Smazat lze pouze plány ve stavu draft nebo generated' },
      { status: 409 }
    )
  }

  try {
    // Delete risks first (in case no CASCADE is configured on the DB)
    const { error: risksError } = await supabase
      .from('crisis_plan_risks')
      .delete()
      .eq('plan_id', planId)

    if (risksError) throw risksError

    const { error: planError } = await supabase
      .from('crisis_plans')
      .delete()
      .eq('id', planId)

    if (planError) throw planError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Crisis Plan DELETE] Error:', error)
    return NextResponse.json({ error: 'Nepodařilo se smazat krizový plán' }, { status: 500 })
  }
}
