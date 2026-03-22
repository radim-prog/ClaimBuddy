import { NextRequest, NextResponse } from 'next/server'
import { extractInvoiceFast, getExtractorConfig } from '@/lib/ai-extractor'
import { mapKimiToExtractedData } from '@/components/extraction/types'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const startTime = Date.now()

  try {
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

    // Check if extraction is available before trying
    let extractionAvailable = false
    try {
      const config = await getExtractorConfig()
      extractionAvailable = !!config.apiKey
    } catch {
      extractionAvailable = false
    }

    if (!extractionAvailable) {
      return NextResponse.json({
        extractionAvailable: false,
        message: 'Extraction service not configured',
      })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Fast extraction (rounds 1+2 only, no verification) for client self-service
    const { invoice } = await extractInvoiceFast(buffer, file.name, file.type)

    // Map to frontend ExtractedData format
    const extractedData = mapKimiToExtractedData(invoice)

    // Map AI document_type to frontend ExtractionDocumentType
    const typeMap: Record<string, string> = {
      receivedInvoice: 'invoice',
      receipt: 'receipt',
      advanceInvoice: 'advance_invoice',
      creditNote: 'credit_note',
      bankStatement: 'bank_statement',
      contract: 'contract',
    }
    const detectedDocumentType = typeMap[invoice.document_type] || 'invoice'

    return NextResponse.json({
      extractionAvailable: true,
      extractedData,
      detectedDocumentType,
      confidenceScore: invoice.confidence_score,
      corrections: invoice.corrections || [],
      roundResults: (invoice as any).roundResults || [],
      processingTime: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[Client Extract] Error:', error)
    // Return graceful response instead of 500 — file can still be saved as draft
    return NextResponse.json({
      extractionAvailable: false,
      extractionError: error instanceof Error ? error.message : 'Unknown error',
      message: 'Extraction failed, document can be saved without extraction',
    })
  }
}
