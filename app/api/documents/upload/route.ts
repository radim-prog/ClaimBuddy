import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { addUpload } from '@/lib/upload-store-db'
import type { DocumentType } from '@/lib/upload-store-db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const companyId = formData.get('companyId') as string
    const period = formData.get('period') as string
    const type = formData.get('type') as string

    if (!file || !companyId || !period || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file size (20MB max - matches bucket limit)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
    }

    // Upload file binary to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer())
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${companyId}/${period}/${timestamp}_${safeName}`

    const { error: storageError } = await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (storageError) {
      console.error('Storage upload error:', storageError)
      return NextResponse.json({ error: 'Failed to store file' }, { status: 500 })
    }

    // Record upload metadata and mutate closure status
    const record = await addUpload({
      company_id: companyId,
      period,
      document_type: type as DocumentType,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: userId,
      storage_path: storagePath,
      mime_type: file.type || null,
    })

    return NextResponse.json({
      success: true,
      document: {
        id: record.id,
        file_name: record.file_name,
        uploaded_at: record.uploaded_at,
        storage_path: record.storage_path,
      },
      message: 'Soubor nahrán'
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
