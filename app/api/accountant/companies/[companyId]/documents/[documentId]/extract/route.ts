import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { populateDenormalizedFields } from '@/lib/document-store'
import { getFirmId, verifyCompanyAccess } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string; documentId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId, documentId } = params

  const firmId = getFirmId(request)
  if (!await verifyCompanyAccess(companyId, firmId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Get document
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const forceReextract = request.nextUrl.searchParams.get('force') === '1'

    // If already has OCR data and not forcing re-extraction, just populate
    if (doc.ocr_data && !forceReextract) {
      await populateDenormalizedFields(documentId, doc.ocr_data)
      return NextResponse.json({
        success: true,
        source: 'existing_ocr',
        message: 'Denormalized fields populated from existing OCR data',
      })
    }

    // Reset stuck documents + mark as extracting
    await supabaseAdmin
      .from('documents')
      .update({
        status: 'extracting',
        ocr_status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    // Get file URL from storage_path (set during upload)
    const storagePath = doc.storage_path || `${companyId}/${doc.period || 'unsorted'}/${doc.file_name}`
    const { data: signedData } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUrl(storagePath, 600) // 10 min

    if (!signedData?.signedUrl) {
      await supabaseAdmin
        .from('documents')
        .update({ ocr_status: 'error', status: 'uploaded' })
        .eq('id', documentId)
      return NextResponse.json({ error: 'Could not access document file' }, { status: 500 })
    }

    // AI extraction pipeline (model-agnostic)
    try {
      // Download the file into a buffer
      const fileRes = await fetch(signedData.signedUrl)
      if (!fileRes.ok) {
        throw new Error(`Failed to download file: ${fileRes.status}`)
      }
      const buffer = Buffer.from(await fileRes.arrayBuffer())
      const mimeType = doc.mime_type || 'application/pdf'

      const { createExtractor } = await import('@/lib/ai-extractor')
      const extractor = await createExtractor()
      const { invoice, ocrResult } = await extractor.extractFromFile(buffer, doc.file_name, mimeType)

      // Store OCR result and populate denormalized fields
      const ocrData = {
        ...(invoice as unknown as Record<string, unknown>),
        num_pages: ocrResult.num_pages,
        ocr_text_length: ocrResult.text.length,
      }
      await supabaseAdmin
        .from('documents')
        .update({
          ocr_data: ocrData,
          ocr_processed: true,
          ocr_status: 'completed',
          status: 'extracted',
          confidence_score: invoice.confidence_score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      await populateDenormalizedFields(documentId, ocrData)

      return NextResponse.json({
        success: true,
        source: 'ai_extractor',
        confidence_score: invoice.confidence_score,
      })
    } catch (ocrErr) {
      console.error('AI extraction failed:', ocrErr)
      await supabaseAdmin
        .from('documents')
        .update({
          ocr_status: 'error',
          status: 'uploaded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
      return NextResponse.json({ error: 'AI extraction failed' }, { status: 500 })
    }
  } catch (err) {
    console.error('Extract document error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
