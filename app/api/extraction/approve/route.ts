import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { populateDenormalizedFields } from '@/lib/document-store'
import { isStaffRole } from '@/lib/access-check'

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
      // New format: update existing document
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

      return NextResponse.json({ success: true, status })
    } else if (company_id && extracted_data) {
      // Legacy format: create new document record
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
