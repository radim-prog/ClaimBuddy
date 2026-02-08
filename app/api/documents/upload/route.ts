import { NextResponse } from 'next/server'
import { addUpload } from '@/lib/upload-store-db'
import type { DocumentType } from '@/lib/upload-store-db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const companyId = formData.get('companyId') as string
    const period = formData.get('period') as string
    const type = formData.get('type') as string

    if (!file || !companyId || !period || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const uploadedBy = request.headers.get('x-user-name') || 'Klient'

    // Record upload and mutate closure status
    const record = await addUpload({
      company_id: companyId,
      period,
      document_type: type as DocumentType,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: uploadedBy,
    })

    return NextResponse.json({
      success: true,
      document: {
        id: record.id,
        file_name: record.file_name,
        uploaded_at: record.uploaded_at,
      },
      message: 'Soubor nahrán'
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
