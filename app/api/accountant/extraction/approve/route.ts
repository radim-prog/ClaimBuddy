import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// POST - approve or reject an extraction
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { document_id, company_id, action, extracted_data, corrections, notes } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "approve" or "reject"' }, { status: 400 })
    }
    if (!company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // If document_id exists, update existing document
    if (document_id) {
      const updateData: Record<string, unknown> = {
        company_id,
        ocr_status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: userId,
        reviewed_at: now,
        updated_at: now,
      }

      if (extracted_data) {
        updateData.ocr_data = extracted_data
        updateData.supplier_name = extracted_data.supplier_name || extracted_data.supplier?.name || null
        updateData.supplier_ico = extracted_data.supplier_ico || extracted_data.supplier?.ico || null
        updateData.supplier_dic = extracted_data.supplier_dic || extracted_data.supplier?.dic || null
        updateData.confidence_score = extracted_data.confidence_score || null
      }
      if (notes) updateData.notes = notes

      const { error } = await supabaseAdmin
        .from('documents')
        .update(updateData)
        .eq('id', document_id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, document_id, action })
    }

    // No document_id — create new document record (direct accountant upload + approve)
    const record: Record<string, unknown> = {
      company_id,
      file_name: body.file_name || 'manual-extraction',
      document_type: body.document_type || 'invoice',
      ocr_data: extracted_data || null,
      ocr_status: action === 'approve' ? 'approved' : 'rejected',
      ocr_processed: true,
      supplier_name: extracted_data?.supplier_name || extracted_data?.supplier?.name || null,
      supplier_ico: extracted_data?.supplier_ico || extracted_data?.supplier?.ico || null,
      supplier_dic: extracted_data?.supplier_dic || extracted_data?.supplier?.dic || null,
      confidence_score: extracted_data?.confidence_score || null,
      reviewed_by: userId,
      reviewed_at: now,
      created_by: userId,
      notes: notes || null,
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert(record)
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, document_id: data.id, action })
  } catch (error) {
    console.error('[Extraction Approve] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - list submissions pending review
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'submitted'

    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, company_id, file_name, document_type, ocr_status, ocr_data, supplier_name, supplier_ico, confidence_score, submitted_by, submitted_at, notes, created_at')
      .eq('ocr_status', status)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ documents: data || [] })
  } catch (error) {
    console.error('[Extraction Approve GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
