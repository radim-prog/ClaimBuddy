import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { populateDenormalizedFields } from '@/lib/document-store'
import { isStaffRole, canAccessCompany } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

/**
 * POST /api/extraction/approve
 * Approve or reject an extracted document
 * Body: { documentId, editedData, action: 'approve' | 'reject' | 'problem' }
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { documentId, editedData, action, company_id, extracted_data, file_name, document_type, notes } = body

    // Support both new (documentId) and legacy (company_id + extracted_data) formats
    if (documentId) {
      // New format: update existing document — verify ownership first
      const { data: doc } = await supabaseAdmin
        .from('documents')
        .select('company_id')
        .eq('id', documentId)
        .single()

      if (!doc) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      const impersonate = request.headers.get('x-impersonate-company')
      if (!(await canAccessCompany(userId, userRole, doc.company_id, impersonate))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'extracted'

      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
        reviewed_by: action === 'approve' ? userId : undefined,
        reviewed_at: action === 'approve' ? new Date().toISOString() : undefined,
      }

      if (editedData) {
        updateData.ocr_data = editedData
      }

      const { error } = await supabaseAdmin
        .from('documents')
        .update(updateData)
        .eq('id', documentId)

      if (error) {
        console.error('[Approve] Update error:', error)
        return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
      }

      // Populate denormalized fields if approving
      if (action === 'approve' && editedData) {
        try {
          await populateDenormalizedFields(documentId, editedData)
        } catch (e) {
          console.warn('[Approve] Denormalize warning:', e)
        }
      }

      // Re-match: trigger auto-match for unmatched transactions after approval
      if (action === 'approve') {
        try {
          const { autoMatchTransaction } = await import('@/lib/bank-matching')
          const { data: unmatchedTxs } = await supabaseAdmin
            .from('bank_transactions')
            .select('*')
            .eq('company_id', doc.company_id)
            .is('matched_document_id', null)
            .is('matched_invoice_id', null)
            .limit(200)

          if (unmatchedTxs && unmatchedTxs.length > 0) {
            const newDoc = editedData || {}
            const matchableDocs = [{
              id: documentId,
              variable_symbol: newDoc.variable_symbol || null,
              total_with_vat: newDoc.total_with_vat || newDoc.total_amount || null,
              date_issued: newDoc.date_issued || null,
              supplier_name: newDoc.supplier_name || null,
              supplier_ico: newDoc.supplier_ico || null,
            }]

            for (const tx of unmatchedTxs) {
              const match = autoMatchTransaction(
                { id: tx.id, amount: tx.amount, variable_symbol: tx.variable_symbol, counterparty_name: tx.counterparty_name, counterparty_account: tx.counterparty_account, transaction_date: tx.transaction_date, description: tx.description },
                matchableDocs,
                []
              )
              if (match) {
                await supabaseAdmin
                  .from('bank_transactions')
                  .update({ matched_document_id: match.document_id, match_confidence: match.confidence, match_method: match.method, tax_impact: 0, vat_impact: 0, updated_at: new Date().toISOString() })
                  .eq('id', tx.id)
              }
            }
          }
        } catch (e) {
          console.warn('[Approve] Re-match warning:', e)
        }
      }

      return NextResponse.json({ success: true, status })
    } else if (company_id && extracted_data) {
      // Legacy format: verify company ownership before creating
      const impersonate = request.headers.get('x-impersonate-company')
      if (!(await canAccessCompany(userId, userRole, company_id, impersonate))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { data: doc, error } = await supabaseAdmin
        .from('documents')
        .insert({
          company_id,
          file_name: file_name || 'unknown',
          type: document_type === 'receipt' ? 'receipt' : 'invoice',
          status: 'approved',
          ocr_data: extracted_data,
          ocr_processed: true,
          ocr_status: 'completed',
          uploaded_by: userId,
          period: extracted_data.date_issued?.substring(0, 7) || new Date().toISOString().substring(0, 7),
        })
        .select('id')
        .single()

      if (error) {
        console.error('[Approve Legacy] Insert error:', error)
        return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
      }

      if (doc) {
        try {
          await populateDenormalizedFields(doc.id, extracted_data)
        } catch (e) {
          console.warn('[Approve Legacy] Denormalize warning:', e)
        }
      }

      return NextResponse.json({ success: true, documentId: doc?.id })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('[Approve] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
