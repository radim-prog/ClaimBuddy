import { NextRequest, NextResponse } from 'next/server'
import { extractionQueue } from '@/lib/extraction-queue'
import { checkExtractionCredits, logGatedAction } from '@/lib/plan-gate'
import { consumeCredit } from '@/lib/subscription-store'
import { recordRevenueTransaction } from '@/lib/revenue-sharing'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']

/**
 * POST /api/extraction/extract
 * Submit a document for extraction via the queue
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Plan gate: check extraction feature + credit limits
  const gate = await checkExtractionCredits(userId)
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const companyId = formData.get('companyId') as string || ''
    const documentId = formData.get('documentId') as string || `doc_${Date.now()}`
    const fastMode = formData.get('fastMode') === 'true'
    const priority = (formData.get('priority') as string) || 'normal'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const job = await extractionQueue.submit({
      documentId,
      companyId,
      fileName: file.name,
      mimeType: file.type,
      buffer,
      priority: priority as 'high' | 'normal' | 'low',
      submittedBy: userId,
      fastMode,
    })

    // Consume extraction credit after successful extraction
    const currentPeriod = new Date().toISOString().slice(0, 7)
    await consumeCredit(userId, 'extraction', currentPeriod)
    await logGatedAction(userId, 'extraction_used', documentId)

    // Revenue sharing: record transaction for marketplace provider
    recordRevenueTransaction({
      userId,
      companyId,
      pluginType: 'extraction',
      resourceId: documentId,
    })

    return NextResponse.json({
      success: true,
      data: {
        ...job.result,
        ocrResult: job.ocrResult ? {
          text: job.ocrResult.text,
          layout_details: job.ocrResult.layout_details,
          pages: job.ocrResult.pages,
          num_pages: job.ocrResult.num_pages,
        } : undefined,
      },
      jobId: job.id,
      processingTime: (job.completedAt || Date.now()) - job.createdAt,
    })
  } catch (error) {
    console.error('[Extraction API] Error:', error)
    const message = error instanceof Error ? error.message : 'Extraction failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
