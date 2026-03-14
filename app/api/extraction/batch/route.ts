import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractionQueue } from '@/lib/extraction-queue'

export const dynamic = 'force-dynamic'

/**
 * POST /api/extraction/batch
 * Batch extract documents by IDs
 * Body: { documentIds: string[], fastMode?: boolean }
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { documentIds, fastMode } = await request.json()

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'documentIds array required' }, { status: 400 })
    }

    if (documentIds.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 documents per batch' }, { status: 400 })
    }

    // Fetch documents from DB
    const { data: documents, error: dbError } = await supabaseAdmin
      .from('documents')
      .select('id, company_id, file_name, storage_path, mime_type')
      .in('id', documentIds)
      .is('deleted_at', null)

    if (dbError || !documents) {
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    const jobs: Array<{ documentId: string; jobId: string; status: string; error?: string }> = []

    for (const doc of documents) {
      try {
        // Download file from storage
        const { data: fileData, error: storageError } = await supabaseAdmin.storage
          .from('documents')
          .download(doc.storage_path)

        if (storageError || !fileData) {
          jobs.push({ documentId: doc.id, jobId: '', status: 'error', error: 'File not found in storage' })
          continue
        }

        const buffer = Buffer.from(await fileData.arrayBuffer())

        // Mark as extracting
        await supabaseAdmin
          .from('documents')
          .update({ ocr_status: 'processing', status: 'extracting' })
          .eq('id', doc.id)

        // Submit to queue (don't await — batch is fire-and-forget)
        extractionQueue.submit({
          documentId: doc.id,
          companyId: doc.company_id,
          fileName: doc.file_name,
          mimeType: doc.mime_type || 'application/pdf',
          buffer,
          priority: 'normal',
          submittedBy: userId,
          fastMode,
        }).then(async (job) => {
          // On completion, update DB
          if (job.result) {
            await supabaseAdmin
              .from('documents')
              .update({
                ocr_data: job.result as unknown as Record<string, unknown>,
                ocr_processed: true,
                ocr_status: 'completed',
                status: 'extracted',
                updated_at: new Date().toISOString(),
              })
              .eq('id', doc.id)
          }
        }).catch(async (err) => {
          await supabaseAdmin
            .from('documents')
            .update({
              ocr_status: 'error',
              status: 'uploaded',
              updated_at: new Date().toISOString(),
            })
            .eq('id', doc.id)
          console.error(`[Batch] Job for ${doc.id} failed:`, err)
        })

        jobs.push({ documentId: doc.id, jobId: `queued`, status: 'queued' })
      } catch (err) {
        jobs.push({ documentId: doc.id, jobId: '', status: 'error', error: String(err) })
      }
    }

    return NextResponse.json({
      success: true,
      submitted: jobs.filter(j => j.status === 'queued').length,
      errors: jobs.filter(j => j.status === 'error').length,
      jobs,
    })
  } catch (error) {
    console.error('[Batch Extraction] Error:', error)
    return NextResponse.json({ error: 'Batch extraction failed' }, { status: 500 })
  }
}
