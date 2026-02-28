import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// POST - create a new draft from OCR extraction
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id, file_name, document_type, extracted_data } = body

    if (!company_id) {
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })
    }

    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const record = {
      company_id,
      file_name: file_name || 'document',
      type: document_type || 'invoice',
      // Note: 'type' is the actual DB column, not 'document_type'
      period,
      status: 'uploaded',
      ocr_status: 'draft',
      ocr_data: extracted_data || null,
      ocr_processed: true,
      supplier_name: extracted_data?.supplier_name || null,
      supplier_ico: extracted_data?.supplier_ico || null,
      uploaded_by: userId,
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert(record)
      .select('id')
      .single()

    if (error) {
      console.error('[Client Drafts] Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, status: 'draft' })
  } catch (error) {
    console.error('[Client Drafts] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - list user's drafts
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get user's companies
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('owner_id', userId)
      .is('deleted_at', null)

    const companyIds = (companies ?? []).map(c => c.id)
    if (companyIds.length === 0) {
      return NextResponse.json({ drafts: [], count: 0 })
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, company_id, file_name, type, ocr_status, ocr_data, supplier_name, created_at')
      .in('company_id', companyIds)
      .eq('ocr_status', 'draft')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ drafts: data || [], count: (data || []).length })
  } catch (error) {
    console.error('[Client Drafts GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
