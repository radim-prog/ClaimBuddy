import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { updateDocumentInboxItemStatus } from '@/lib/document-inbox-store'
import { addUpload, type DocumentType } from '@/lib/upload-store-db'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ itemId: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || !isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { itemId } = await params
  const body = await request.json()
  const { document_type, period, extract } = body as {
    document_type: DocumentType
    period: string // e.g. "2026-03"
    extract?: boolean
  }

  if (!document_type || !period) {
    return NextResponse.json({ error: 'Missing document_type or period' }, { status: 400 })
  }

  try {
    // 1. Fetch the inbox item
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('document_inbox_items')
      .select('*')
      .eq('id', itemId)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // IDOR: verify the item belongs to a company this user can access
    if (userRole !== 'admin') {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('id', item.company_id)
        .eq('assigned_accountant_id', userId)
        .is('deleted_at', null)
        .maybeSingle()
      if (!company) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (item.status === 'imported') {
      return NextResponse.json({ error: 'Item already imported' }, { status: 400 })
    }

    // 2. Mark as processing
    await updateDocumentInboxItemStatus(itemId, 'processing', { processed_by: userId })

    // 3. Create document via addUpload
    const doc = await addUpload({
      company_id: item.company_id,
      period,
      document_type,
      file_name: item.filename,
      file_size: item.file_size_bytes || 0,
      uploaded_by: userId,
      storage_path: item.storage_path,
      mime_type: item.mime_type,
    })

    // 4. Mark inbox item as imported with document_id reference
    await updateDocumentInboxItemStatus(itemId, 'imported', {
      document_id: doc.id,
      processed_by: userId,
    })

    // 5. Optionally queue for extraction (requires downloading the file buffer)
    if (extract && item.storage_path) {
      try {
        const { data: fileData } = await supabaseAdmin
          .storage
          .from('documents')
          .download(item.storage_path)

        if (fileData) {
          const arrayBuffer = await fileData.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          const { extractionQueue } = await import('@/lib/extraction-queue')
          await extractionQueue.submit({
            documentId: doc.id,
            companyId: item.company_id,
            fileName: item.filename,
            mimeType: item.mime_type || 'application/pdf',
            buffer,
            priority: 'normal',
            submittedBy: userId,
          })
        }
      } catch (extractError) {
        console.error('Extraction queue error (non-fatal):', extractError)
        // Don't fail the whole operation if extraction queuing fails
      }
    }

    return NextResponse.json({
      success: true,
      document: doc,
    })
  } catch (error) {
    // If something went wrong, mark as failed
    try {
      await updateDocumentInboxItemStatus(itemId, 'failed', {
        processed_by: userId,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
    } catch { /* ignore secondary error */ }
    console.error('Inbox process error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
