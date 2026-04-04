import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'
import { validateCashTransaction, getDailyPartnerTotal } from '@/lib/cash-validation'

export const dynamic = 'force-dynamic'

// PATCH /api/client/cash-transactions/[id] — edit
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    // Fetch existing to verify ownership
    const { data: existing } = await supabaseAdmin
      .from('cash_transactions')
      .select('company_id, doc_type, transaction_date, amount, counterparty_name')
      .eq('id', id)
      .single()

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const userRole = request.headers.get('x-user-role')
    const impersonate = request.headers.get('x-impersonate-company')
    const allowed = await canAccessCompany(userId, userRole, existing.company_id, impersonate)
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const updates: Record<string, any> = {}

    if (body.transaction_date !== undefined) updates.transaction_date = body.transaction_date
    if (body.amount !== undefined) {
      const docType = body.doc_type || existing.doc_type
      updates.amount = docType === 'PPD' ? Math.abs(body.amount) : -Math.abs(body.amount)
    }
    if (body.description !== undefined) updates.description = body.description || null
    if (body.counterparty_name !== undefined) updates.counterparty_name = body.counterparty_name || null
    if (body.category !== undefined) updates.category = body.category
    if (body.period !== undefined) updates.period = body.period

    // Validate
    const txForValidation = {
      doc_type: body.doc_type || existing.doc_type,
      transaction_date: body.transaction_date || existing.transaction_date,
      amount: body.amount ? Math.abs(body.amount) : Math.abs(existing.amount),
      counterparty_name: body.counterparty_name ?? existing.counterparty_name,
    }

    let dailyTotal = 0
    if (txForValidation.counterparty_name && txForValidation.transaction_date) {
      dailyTotal = await getDailyPartnerTotal(
        supabaseAdmin, existing.company_id, txForValidation.counterparty_name, txForValidation.transaction_date, id
      )
    }

    // Fetch register balance for VPD validation (exclude current tx)
    let registerBalance: number | undefined
    if (txForValidation.doc_type === 'VPD') {
      const { data: balRow } = await supabaseAdmin
        .from('cash_transactions')
        .select('amount')
        .eq('company_id', existing.company_id)
        .neq('id', id)
      registerBalance = (balRow || []).reduce((sum: number, r: { amount: number }) => sum + r.amount, 0)
    }

    const errors = validateCashTransaction(txForValidation, { dailyTotalForPartner: dailyTotal, registerBalance })
    const hardErrors = errors.filter(e => e.severity === 'error')
    if (hardErrors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: hardErrors }, { status: 422 })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('cash_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      transaction: data,
      warnings: errors.filter(e => e.severity === 'warning'),
    })
  } catch (error) {
    console.error('[CashTransactions PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/client/cash-transactions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const { data: existing } = await supabaseAdmin
      .from('cash_transactions')
      .select('company_id')
      .eq('id', id)
      .single()

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const userRole = request.headers.get('x-user-role')
    const impersonate = request.headers.get('x-impersonate-company')
    const allowed = await canAccessCompany(userId, userRole, existing.company_id, impersonate)
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabaseAdmin
      .from('cash_transactions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CashTransactions DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
