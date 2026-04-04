import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { upsertClosureField } from '@/lib/closure-store-db'
import { canApproveClosures } from '@/lib/permission-check'
import { getFirmId } from '@/lib/firm-scope'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// POST /api/accountant/closures/approve
// Body: { company_id, period, notes? }
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Approve endpoint always sets to 'approved' — check permission (respects two-step workflow)
  const firmId = getFirmId(request)
  const canApprove = await canApproveClosures(userId, firmId)
  if (!canApprove) {
    return NextResponse.json({ error: 'Nemáte oprávnění schvalovat uzávěrky. Vyžaduje se schválení manažerem.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { company_id, period, notes } = body

    if (!company_id || !period) {
      return NextResponse.json({ error: 'Missing company_id or period' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // Update closure status to approved
    const { data: existing } = await supabaseAdmin
      .from('monthly_closures')
      .select('id')
      .eq('company_id', company_id)
      .eq('period', period)
      .single()

    if (existing) {
      const updateData: Record<string, any> = {
        status: 'approved',
        updated_by: userId,
        updated_at: now,
      }
      if (notes) updateData.notes = notes

      await supabaseAdmin
        .from('monthly_closures')
        .update(updateData)
        .eq('id', existing.id)
    } else {
      // Create closure record with approved status
      await supabaseAdmin
        .from('monthly_closures')
        .insert({
          company_id,
          period,
          status: 'approved',
          bank_statement_status: 'approved',
          expense_invoices_status: 'approved',
          income_invoices_status: 'approved',
          notes: notes || null,
          updated_by: userId,
          created_at: now,
          updated_at: now,
        })
    }

    // Audit log
    await logAudit({
      userId,
      action: 'closure_approved',
      tableName: 'monthly_closures',
      recordId: company_id,
      newValues: { period, notes },
      request,
    })

    return NextResponse.json({
      success: true,
      company_id,
      period,
      status: 'approved',
    })
  } catch (error) {
    console.error('[ClosureApprove] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
