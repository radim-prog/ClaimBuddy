import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { batchDetectFuelDocuments } from '@/lib/fuel-extractor'

export const dynamic = 'force-dynamic'

// POST: Auto-detect fuel documents for a period
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { period_start, period_end } = body as { period_start: string; period_end: string }

    if (!period_start || !period_end) {
      return NextResponse.json({ error: 'period_start and period_end required' }, { status: 400 })
    }

    // Fetch all documents for the company in the period range
    const { data: documents, error } = await supabaseAdmin
      .from('documents')
      .select('id, ocr_data, supplier_name, type, period, file_name, status, total_with_vat, date_issued')
      .eq('company_id', params.companyId)
      .gte('period', period_start)
      .lte('period', period_end)
      .in('type', ['receipt', 'cash_receipt', 'expense_invoice', 'other'])
      .in('status', ['uploaded', 'extracted', 'approved', 'booked'])
      .order('date_issued', { ascending: true })

    if (error) throw error

    // Run fuel detection
    const detections = batchDetectFuelDocuments(
      (documents || []).map(doc => ({
        id: doc.id,
        ocr_data: doc.ocr_data as Record<string, unknown> | null,
        supplier_name: doc.supplier_name,
        type: doc.type,
      }))
    )

    // Enrich with document metadata
    const enriched = detections.map(det => {
      const doc = (documents || []).find(d => d.id === det.document_id)
      return {
        ...det,
        file_name: doc?.file_name || null,
        period: doc?.period || null,
        date_issued: doc?.date_issued || null,
        total_with_vat: doc?.total_with_vat || null,
        supplier_name: doc?.supplier_name || null,
      }
    })

    return NextResponse.json({
      fuel_documents: enriched,
      total_scanned: (documents || []).length,
      total_detected: enriched.length,
    })
  } catch (error) {
    console.error('Detect fuel docs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
