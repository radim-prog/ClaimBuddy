import { NextRequest, NextResponse } from 'next/server'
import { extractInvoiceFromFile, isKimiAIAvailable } from '@/lib/kimi-ai'
import { mapKimiToExtractedData } from '@/components/extraction/types'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const startTime = Date.now()

  try {
    if (!isKimiAIAvailable()) {
      return NextResponse.json(
        { error: 'OCR not configured', message: 'MOONSHOT_API_KEY not set' },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 3-round extraction
    const invoice = await extractInvoiceFromFile(buffer, file.name, file.type)

    // Map to frontend ExtractedData format
    const extractedData = mapKimiToExtractedData(invoice)

    return NextResponse.json({
      extractedData,
      confidenceScore: invoice.confidence_score,
      corrections: invoice.corrections || [],
      roundResults: (invoice as any).roundResults || [],
      processingTime: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[Client Extract] Error:', error)
    return NextResponse.json(
      { error: 'Extraction failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
