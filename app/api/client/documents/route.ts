import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserCompanyIds } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const impersonateCompany = request.headers.get('x-impersonate-company')

  try {
    let companyIds: string[] = []

    if (impersonateCompany) {
      companyIds = [impersonateCompany]
    } else {
      companyIds = await getUserCompanyIds(userId)
    }

    if (companyIds.length === 0) {
      return NextResponse.json({ documents: [], count: 0 })
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, company_id, period, type, file_name, file_size_bytes, status, ocr_status, uploaded_at, created_at, storage_path, supplier_name, total_with_vat, confidence_score, ocr_data, date_issued, document_number, variable_symbol')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })
      .limit(100)

    if (error) throw new Error(error.message)

    const documents = (data ?? []).map(d => {
      const ocrData = d.ocr_data as Record<string, unknown> | null
      return {
        id: d.id,
        company_id: d.company_id,
        period: d.period,
        type: d.type,
        file_name: d.file_name,
        file_size_bytes: d.file_size_bytes || 0,
        status: d.status,
        ocr_status: d.ocr_status || null,
        uploaded_at: d.uploaded_at || d.created_at,
        storage_path: d.storage_path || null,
        // Extraction metadata
        supplier_name: d.supplier_name || (ocrData?.supplier_name as string) || null,
        total_with_vat: d.total_with_vat || (ocrData?.total_amount as number) || null,
        confidence_score: d.confidence_score || (ocrData?.confidence as number) || null,
        date_issued: d.date_issued || (ocrData?.date_issued as string) || null,
        document_number: d.document_number || (ocrData?.document_number as string) || null,
        variable_symbol: d.variable_symbol || (ocrData?.variable_symbol as string) || null,
      }
    })

    return NextResponse.json({ documents, count: documents.length })
  } catch (error) {
    console.error('Client documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
