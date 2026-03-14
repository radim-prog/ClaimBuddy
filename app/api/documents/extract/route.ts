import { NextRequest, NextResponse } from 'next/server'
import { extractInvoice, type ExtractedInvoice } from '@/lib/ai-extractor'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
]

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const startTime = Date.now()

  try {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { error: 'Invalid form data', message: 'Could not parse multipart/form-data' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', message: 'Field "file" is required' },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Unsupported file type',
          message: `Type "${file.type}" not supported. Allowed: PDF, JPG, PNG`,
          allowedTypes: ALLOWED_MIME_TYPES
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'File too large',
          message: `Maximum file size is 10MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`,
          maxSize: MAX_FILE_SIZE,
          actualSize: file.size
        },
        { status: 413 }
      )
    }

    const documentType = formData.get('documentType') as string | null

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log(`[Extract API] Processing file: ${file.name} (${file.type}, ${file.size} bytes)`)

    const invoice: ExtractedInvoice = await extractInvoice(
      buffer,
      file.name,
      file.type
    )

    const processingTime = Date.now() - startTime

    console.log(`[Extract API] Extraction complete: ${invoice.document_number} (${processingTime}ms)`)

    return NextResponse.json({
      success: true,
      data: invoice,
      processingTime,
      documentType: documentType || null,
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('[Extract API] Extraction failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Extraction failed',
        message: errorMessage,
        processingTime
      },
      { status: 500 }
    )
  }
}
