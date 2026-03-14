import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/extraction/verify
 * List documents ready for verification (extracted but not approved)
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get documents with OCR data that need verification
    const { data: documents, error } = await supabaseAdmin
      .from('documents')
      .select('id, company_id, file_name, storage_path, status, ocr_data, ocr_status, mime_type')
      .eq('ocr_processed', true)
      .in('status', ['extracted', 'corrected'])
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Get company names
    const companyIds = [...new Set((documents || []).map(d => d.company_id).filter(Boolean))]
    const { data: companies } = companyIds.length > 0
      ? await supabaseAdmin.from('companies').select('id, name').in('id', companyIds)
      : { data: [] }

    const companyMap = new Map((companies || []).map(c => [c.id, c.name]))

    const result = (documents || []).map(doc => ({
      id: doc.id,
      company_id: doc.company_id,
      company_name: companyMap.get(doc.company_id) || 'Neznámý',
      file_name: doc.file_name,
      storage_path: doc.storage_path,
      status: doc.status,
      ocr_data: doc.ocr_data,
      ocr_status: doc.ocr_status,
      mime_type: doc.mime_type || 'application/pdf',
    }))

    return NextResponse.json({ documents: result })
  } catch (error) {
    console.error('[Verify API] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
