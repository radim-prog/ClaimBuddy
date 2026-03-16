import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = params
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period')
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  try {
    let query = supabaseAdmin
      .from('documents')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })

    if (period) {
      query = query.eq('period', period)
    } else {
      // Filter by year: periods starting with YYYY-
      query = query.like('period', `${year}-%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const documents = (data ?? []).map(d => ({
      id: d.id,
      company_id: d.company_id,
      period: d.period,
      type: d.type,
      file_name: d.file_name,
      file_size_bytes: d.file_size_bytes || 0,
      status: d.status || 'uploaded',
      ocr_processed: d.ocr_processed || false,
      ocr_status: d.ocr_status,
      ocr_data: d.ocr_data,
      uploaded_by: d.uploaded_by,
      uploaded_at: d.uploaded_at || d.created_at,
      upload_source: d.upload_source || 'web',
      reviewed_by: d.reviewed_by,
      reviewed_at: d.reviewed_at,
      rejection_reason: d.rejection_reason,
    }))

    // Build summary
    const byType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    for (const doc of documents) {
      byType[doc.type] = (byType[doc.type] || 0) + 1
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1
    }

    return NextResponse.json({
      documents,
      summary: {
        total: documents.length,
        by_type: byType,
        by_status: byStatus,
      },
    })
  } catch (err) {
    console.error('Company documents API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Approve or reject a document
export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { document_id, action, rejection_reason, type, file_name } = body

    if (!document_id) {
      return NextResponse.json({ error: 'Missing document_id' }, { status: 400 })
    }

    // Type or file_name update
    if ((type || file_name) && !action) {
      const updateFields: Record<string, any> = { updated_at: new Date().toISOString() }
      if (type) updateFields.type = type
      if (file_name) {
        const sanitized = file_name.trim().slice(0, 255)
        if (!sanitized) return NextResponse.json({ error: 'Invalid file_name' }, { status: 400 })
        updateFields.file_name = sanitized
      }
      const { data: doc, error } = await supabaseAdmin
        .from('documents')
        .update(updateFields)
        .eq('id', document_id)
        .eq('company_id', params.companyId)
        .select('id, type, file_name')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, document: doc })
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const updates: Record<string, any> = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    }
    if (action === 'reject' && rejection_reason) {
      updates.rejection_reason = rejection_reason
    }

    const { data: doc, error } = await supabaseAdmin
      .from('documents')
      .update(updates)
      .eq('id', document_id)
      .eq('company_id', params.companyId)
      .select('id, type, period, status')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update closure status if approved
    if (action === 'approve' && doc) {
      const closureFieldMap: Record<string, string> = {
        bank_statement: 'bank_statement_status',
        expense_invoice: 'expense_invoices_status',
        receipt: 'expense_invoices_status',
        income_invoice: 'income_invoices_status',
      }
      const closureField = closureFieldMap[doc.type]
      if (closureField) {
        await supabaseAdmin
          .from('monthly_closures')
          .update({ [closureField]: 'approved', updated_by: userId })
          .eq('company_id', params.companyId)
          .eq('period', doc.period)
      }
    }

    return NextResponse.json({ success: true, document: doc })
  } catch (err) {
    console.error('Document update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
