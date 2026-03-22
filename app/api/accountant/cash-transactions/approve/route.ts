import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// POST /api/accountant/cash-transactions/approve
// Bulk approve cash transactions for a period
// Body: { company_id, period, transaction_ids?: string[] }
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { company_id, period, transaction_ids } = await request.json()

    if (!company_id || !period) {
      return NextResponse.json({ error: 'Missing company_id or period' }, { status: 400 })
    }

    // Update closure cash_documents_status to approved
    const { data: existing } = await supabaseAdmin
      .from('monthly_closures')
      .select('id')
      .eq('company_id', company_id)
      .eq('period', period)
      .single()

    if (existing) {
      await supabaseAdmin
        .from('monthly_closures')
        .update({
          cash_documents_status: 'approved',
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin
        .from('monthly_closures')
        .insert({
          company_id,
          period,
          cash_documents_status: 'approved',
          status: 'open',
          created_by: userId,
          updated_by: userId,
        })
    }

    // If specific transaction_ids, mark them individually (future: per-tx approval flag)
    let approvedCount = 0
    if (transaction_ids && Array.isArray(transaction_ids) && transaction_ids.length > 0) {
      approvedCount = transaction_ids.length
    } else {
      // Count all transactions in period
      const { data: txs } = await supabaseAdmin
        .from('cash_transactions')
        .select('id')
        .eq('company_id', company_id)
        .eq('period', period)

      approvedCount = txs?.length || 0
    }

    // Activity log
    try {
      await supabaseAdmin.from('activity_log').insert({
        user_id: userId,
        action: 'cash_approved',
        entity_type: 'cash_transactions',
        entity_id: company_id,
        metadata: { period, approved_count: approvedCount },
      })
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      company_id,
      period,
      approved_count: approvedCount,
    })
  } catch (error) {
    console.error('[CashApprove] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
