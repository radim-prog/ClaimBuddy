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
      .select('id, ocr_status, ocr_processed, status, company_id, ocr_data')
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

    // Confidence breakdown for extracted (non-approved) documents
    const extractedDocs = docs.filter(d => d.ocr_processed && d.status === 'extracted')
    let okCount = 0
    let warningsCount = 0
    let errorsCount = 0

    for (const d of extractedDocs) {
      if (d.ocr_status === 'error') {
        errorsCount++
      } else {
        const score = d.ocr_data?.confidence_score
        if (score === undefined || score === null || score < 50) {
          errorsCount++
        } else if (score < 80) {
          warningsCount++
        } else {
          okCount++
        }
      }
    }

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
      by_confidence: {
        ok: okCount,
        warnings: warningsCount,
        errors: errorsCount,
      },
    })
  } catch (error) {
    console.error('[Extraction Stats] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
