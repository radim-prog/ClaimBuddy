import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// Upload a file attachment for a chat message
// Stores in Supabase Storage bucket 'documents' under chat-attachments/{companyId}/
// Returns a download URL that can be embedded in the message
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const companyId = formData.get('companyId') as string | null
    const taskId = formData.get('taskId') as string | null
    const chatId = formData.get('chatId') as string

    if (!file || !chatId) {
      return NextResponse.json({ error: 'Missing required fields (file, chatId)' }, { status: 400 })
    }

    const ALLOWED_MIME_TYPES = [
      'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'text/csv', 'text/plain', 'application/xml', 'text/xml',
    ]
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Nepodporovaný typ souboru' }, { status: 400 })
    }
    if (!companyId && !taskId) {
      return NextResponse.json({ error: 'Either companyId or taskId is required' }, { status: 400 })
    }

    // Verify user has access to the target company
    if (companyId) {
      const userRole = request.headers.get('x-user-role')
      const impersonateCompany = request.headers.get('x-impersonate-company')
      const hasAccess = await canAccessCompany(userId, userRole, companyId, impersonateCompany)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Soubor je příliš velký (max 20 MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const folder = companyId || `task-${taskId}`
    const storagePath = `chat-attachments/${folder}/${timestamp}_${safeName}`

    const { error: storageError } = await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (storageError) {
      console.error('Chat attachment upload error:', storageError)
      return NextResponse.json({ error: 'Nepodařilo se nahrát soubor' }, { status: 500 })
    }

    // Generate a signed URL (valid for 7 days)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUrl(storagePath, 7 * 24 * 3600)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL error:', signedUrlError)
      return NextResponse.json({ error: 'Soubor nahrán, ale nepodařilo se vytvořit odkaz' }, { status: 500 })
    }

    return NextResponse.json({
      attachment: {
        name: file.name,
        url: signedUrlData.signedUrl,
        storage_path: storagePath,
        size: file.size,
        mime_type: file.type,
      },
    })
  } catch (error) {
    console.error('Chat attachment upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
