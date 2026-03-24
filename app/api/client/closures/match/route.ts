import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'
import { upsertClosureField } from '@/lib/closure-store-db'
import { calculateDetailedTaxImpact } from '@/lib/tax-impact'

export const dynamic = 'force-dynamic'

// POST /api/client/closures/match
// Body: { transaction_id, action: 'confirm'|'reject'|'manual', document_id?, invoice_id?, dohoda_mesic_id?, category? }
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { transaction_id, action, document_id, invoice_id, dohoda_mesic_id, category } = body

    if (!transaction_id || !action) {
      return NextResponse.json({ error: 'Missing transaction_id or action' }, { status: 400 })
    }

    if (!['confirm', 'reject', 'manual'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use: confirm, reject, manual' }, { status: 400 })
    }

    // Get transaction to verify ownership
    const { data: tx, error: txError } = await supabaseAdmin
      .from('bank_transactions')
      .select('id, company_id, period, amount, matched_document_id, matched_invoice_id, matched_dohoda_mesic_id')
      .eq('id', transaction_id)
      .single()

    if (txError || !tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const userRole = request.headers.get('x-user-role')
    const impersonate = request.headers.get('x-impersonate-company')
    if (!(await canAccessCompany(userId, userRole, tx.company_id, impersonate))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date().toISOString()

    if (action === 'confirm') {
      // Confirm existing auto-match — upgrade confidence to 1.0 and method to manual
      if (!tx.matched_document_id && !tx.matched_invoice_id && !tx.matched_dohoda_mesic_id) {
        return NextResponse.json({ error: 'Transaction has no match to confirm' }, { status: 400 })
      }

      await supabaseAdmin
        .from('bank_transactions')
        .update({
          match_confidence: 1.0,
          match_method: 'manual',
          tax_impact: 0,
          vat_impact: 0,
          social_impact: 0,
          health_impact: 0,
          total_impact: 0,
          updated_at: now,
        })
        .eq('id', transaction_id)

    } else if (action === 'reject') {
      // Reject match — clear all match fields
      await supabaseAdmin
        .from('bank_transactions')
        .update({
          matched_document_id: null,
          matched_invoice_id: null,
          matched_dohoda_mesic_id: null,
          match_confidence: null,
          match_method: null,
          updated_at: now,
        })
        .eq('id', transaction_id)

      // Recalculate tax impact for rejected expense
      if (tx.amount < 0) {
        const { data: company } = await supabaseAdmin
          .from('companies')
          .select('legal_form, vat_payer')
          .eq('id', tx.company_id)
          .single()
        if (company) {
          const impact = calculateDetailedTaxImpact(tx.amount, company.legal_form, company.vat_payer)
          await supabaseAdmin
            .from('bank_transactions')
            .update({
              tax_impact: impact.income_tax,
              vat_impact: impact.vat,
              social_impact: impact.social_insurance,
              health_impact: impact.health_insurance,
              total_impact: impact.total,
            })
            .eq('id', transaction_id)
        }
      }

    } else if (action === 'manual') {
      // Manual match — requires at least one target ID
      if (!document_id && !invoice_id && !dohoda_mesic_id) {
        return NextResponse.json(
          { error: 'Manual match requires document_id, invoice_id, or dohoda_mesic_id' },
          { status: 400 }
        )
      }

      // Cross-company ownership validation
      if (document_id) {
        const { data: doc } = await supabaseAdmin
          .from('documents')
          .select('company_id')
          .eq('id', document_id)
          .single()
        if (!doc || doc.company_id !== tx.company_id) {
          return NextResponse.json({ error: 'Document not found or belongs to different company' }, { status: 400 })
        }
      }
      if (invoice_id) {
        const { data: inv } = await supabaseAdmin
          .from('invoices')
          .select('company_id')
          .eq('id', invoice_id)
          .single()
        if (!inv || inv.company_id !== tx.company_id) {
          return NextResponse.json({ error: 'Invoice not found or belongs to different company' }, { status: 400 })
        }
      }
      if (dohoda_mesic_id) {
        const { data: doh } = await supabaseAdmin
          .from('dohoda_mesice')
          .select('company_id')
          .eq('id', dohoda_mesic_id)
          .single()
        if (!doh || doh.company_id !== tx.company_id) {
          return NextResponse.json({ error: 'Dohoda vykaz not found or belongs to different company' }, { status: 400 })
        }
      }

      const updateData: Record<string, any> = {
        matched_document_id: document_id || null,
        matched_invoice_id: invoice_id || null,
        matched_dohoda_mesic_id: dohoda_mesic_id || null,
        match_group_id: null,
        match_confidence: 1.0,
        match_method: 'manual',
        tax_impact: 0,
        vat_impact: 0,
        social_impact: 0,
        health_impact: 0,
        total_impact: 0,
        updated_at: now,
      }

      if (category) {
        updateData.category = category
      }

      await supabaseAdmin
        .from('bank_transactions')
        .update(updateData)
        .eq('id', transaction_id)

      // If matched to dohoda vykaz, update payment status
      if (dohoda_mesic_id) {
        await supabaseAdmin
          .from('dohoda_mesice')
          .update({
            payment_status: 'paid',
            payment_date: tx.period ? `${tx.period}-15` : now.substring(0, 10),
            payment_method: 'bank',
            updated_at: now,
          })
          .eq('id', dohoda_mesic_id)
      }
    }

    // Check if all expenses/income are now matched → auto-advance closure
    if (tx.period && (action === 'confirm' || action === 'manual')) {
      const { count: unmatchedExpenses } = await supabaseAdmin
        .from('bank_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', tx.company_id)
        .eq('period', tx.period)
        .lt('amount', 0)
        .is('matched_document_id', null)
        .is('matched_dohoda_mesic_id', null)
        .not('category', 'in', '("private_transfer","owner_deposit","loan_repayment","internal_transfer")')

      if ((unmatchedExpenses || 0) === 0) {
        await upsertClosureField(tx.company_id, tx.period, 'expense_documents_status', 'approved', userId)
      }

      const { count: unmatchedIncome } = await supabaseAdmin
        .from('bank_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', tx.company_id)
        .eq('period', tx.period)
        .gt('amount', 0)
        .is('matched_invoice_id', null)
        .not('category', 'in', '("other_taxable","private_transfer","owner_deposit","internal_transfer")')

      if ((unmatchedIncome || 0) === 0) {
        await upsertClosureField(tx.company_id, tx.period, 'income_invoices_status', 'approved', userId)
      }
    }

    return NextResponse.json({
      success: true,
      action,
      transaction_id,
    })
  } catch (error) {
    console.error('[ClosureMatch] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
