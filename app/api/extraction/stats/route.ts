import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractionQueue } from '@/lib/extraction-queue'

export const dynamic = 'force-dynamic'

/**
 * GET /api/extraction/stats
 * Dashboard stats for extraction section
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get document counts by OCR status
    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('id, ocr_status, ocr_processed, status, company_id, updated_at')
      .is('deleted_at', null)

    const docs = documents || []

    const total = docs.length
    const extracted = docs.filter(d => d.ocr_processed === true).length
    const pending = docs.filter(d => !d.ocr_processed && d.ocr_status !== 'error' && d.status === 'uploaded').length
    const processing = docs.filter(d => d.ocr_status === 'processing').length
    const errors = docs.filter(d => d.ocr_status === 'error').length
    const approved = docs.filter(d => d.status === 'approved').length

    // Queue status
    const queueStatus = extractionQueue.getStatus()

    // Recent activity — last 10 extractions
    const { data: recentDocs } = await supabaseAdmin
      .from('documents')
      .select('id, file_name, company_id, ocr_status, status, updated_at, ocr_data')
      .eq('ocr_processed', true)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(10)

    // Get company names for recent docs
    const companyIds = [...new Set((recentDocs || []).map(d => d.company_id).filter(Boolean))]
    const { data: companies } = companyIds.length > 0
      ? await supabaseAdmin
          .from('companies')
          .select('id, name')
          .in('id', companyIds)
      : { data: [] }

    const companyMap = new Map((companies || []).map(c => [c.id, c.name]))

    const recentActivity = (recentDocs || []).map(d => ({
      id: d.id,
      fileName: d.file_name,
      companyName: companyMap.get(d.company_id) || 'Neznámý',
      status: d.status,
      ocrStatus: d.ocr_status,
      confidence: d.ocr_data?.confidence_score || null,
      updatedAt: d.updated_at,
    }))

    return NextResponse.json({
      stats: {
        total,
        extracted,
        pending,
        processing,
        errors,
        approved,
      },
      queue: {
        length: queueStatus.queueLength,
        active: queueStatus.activeCount,
      },
      recentActivity,
    })
  } catch (error) {
    console.error('[Extraction Stats] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
