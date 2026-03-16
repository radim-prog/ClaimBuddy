import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// questionnaire_attachments schema:
// id uuid PK default gen_random_uuid(),
// questionnaire_id uuid NOT NULL,
// section_id text NOT NULL,
// company_id uuid NOT NULL,
// file_name text NOT NULL,
// file_path text NOT NULL,
// file_size int NOT NULL,
// mime_type text NOT NULL,
// uploaded_by uuid NOT NULL,
// created_at timestamptz default now()

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_FILES_PER_SECTION = 5

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
]

// POST — upload a file attachment for a questionnaire section
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const questionnaireId = formData.get('questionnaire_id') as string | null
    const sectionId = formData.get('section_id') as string | null
    const companyId = formData.get('company_id') as string | null

    if (!file || !questionnaireId || !sectionId || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, questionnaire_id, section_id, company_id' },
        { status: 400 }
      )
    }

    // Access check
    const userRole = request.headers.get('x-user-role')
    const impersonate = request.headers.get('x-impersonate-company')
    if (!(await canAccessCompany(userId, userRole, companyId, impersonate))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Soubor je příliš velký (max 10 MB)' }, { status: 400 })
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Nepodporovaný typ souboru: ${file.type || 'neznámý'}` },
        { status: 400 }
      )
    }

    // Check per-section file count limit
    const { count, error: countError } = await supabaseAdmin
      .from('questionnaire_attachments')
      .select('id', { count: 'exact', head: true })
      .eq('questionnaire_id', questionnaireId)
      .eq('section_id', sectionId)

    if (countError) {
      console.error('Count attachments error:', countError)
      return NextResponse.json({ error: 'Chyba při kontrole limitů' }, { status: 500 })
    }

    if ((count ?? 0) >= MAX_FILES_PER_SECTION) {
      return NextResponse.json(
        { error: `Maximální počet souborů na sekci je ${MAX_FILES_PER_SECTION}` },
        { status: 400 }
      )
    }

    // Build storage path
    const year = new Date().getFullYear()
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${companyId}/${year}/${sectionId}/${timestamp}_${safeName}`

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: storageError } = await supabaseAdmin.storage
      .from('questionnaire-docs')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (storageError) {
      console.error('Questionnaire upload storage error:', storageError)
      return NextResponse.json({ error: 'Nepodařilo se nahrát soubor' }, { status: 500 })
    }

    // Record in DB
    const { data, error: dbError } = await supabaseAdmin
      .from('questionnaire_attachments')
      .insert({
        questionnaire_id: questionnaireId,
        section_id: sectionId,
        company_id: companyId,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: userId,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Questionnaire attachment DB error:', dbError)
      // Clean up orphaned storage file
      await supabaseAdmin.storage.from('questionnaire-docs').remove([storagePath])
      return NextResponse.json({ error: 'Nepodařilo se uložit záznam' }, { status: 500 })
    }

    return NextResponse.json({ attachment: data }, { status: 201 })
  } catch (error) {
    console.error('Questionnaire upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET — list attachments for a questionnaire (optionally filtered by section)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const questionnaireId = searchParams.get('questionnaire_id')
  const sectionId = searchParams.get('section_id')
  const companyId = searchParams.get('company_id')

  if (!questionnaireId || !companyId) {
    return NextResponse.json(
      { error: 'questionnaire_id and company_id are required' },
      { status: 400 }
    )
  }

  const userRole = request.headers.get('x-user-role')
  const impersonate = request.headers.get('x-impersonate-company')
  if (!(await canAccessCompany(userId, userRole, companyId, impersonate))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabaseAdmin
    .from('questionnaire_attachments')
    .select('*')
    .eq('questionnaire_id', questionnaireId)
    .order('created_at', { ascending: true })

  if (sectionId) {
    query = query.eq('section_id', sectionId)
  }

  const { data, error } = await query

  if (error) {
    console.error('List attachments error:', error)
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 })
  }

  return NextResponse.json({ attachments: data ?? [] })
}

// DELETE — remove an attachment by id
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const attachmentId = searchParams.get('id')
  const companyId = searchParams.get('company_id')

  if (!attachmentId || !companyId) {
    return NextResponse.json({ error: 'id and company_id are required' }, { status: 400 })
  }

  const userRole = request.headers.get('x-user-role')
  const impersonate = request.headers.get('x-impersonate-company')
  if (!(await canAccessCompany(userId, userRole, companyId, impersonate))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch attachment to verify ownership and get storage path
  const { data: attachment, error: fetchError } = await supabaseAdmin
    .from('questionnaire_attachments')
    .select('id, file_path, company_id')
    .eq('id', attachmentId)
    .single()

  if (fetchError || !attachment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Double-check the attachment belongs to the requested company (IDOR guard)
  if (attachment.company_id !== companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Remove from storage
  const { error: storageError } = await supabaseAdmin.storage
    .from('questionnaire-docs')
    .remove([attachment.file_path])

  if (storageError) {
    console.error('Delete attachment storage error:', storageError)
    // Proceed to delete DB record even if storage removal fails
  }

  const { error: dbError } = await supabaseAdmin
    .from('questionnaire_attachments')
    .delete()
    .eq('id', attachmentId)

  if (dbError) {
    console.error('Delete attachment DB error:', dbError)
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
