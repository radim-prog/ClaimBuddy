export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

/**
 * GET /api/accountant/signing/templates
 * List active templates for the accountant
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { data: templates, error } = await supabaseAdmin
      .from('signing_templates')
      .select('*')
      .eq('created_by', userId)
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Signing Templates GET] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('[Signing Templates GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/accountant/signing/templates
 * Upload a new DOCX template (multipart/form-data)
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string | null

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Validate file type
    const fileName = file.name || ''
    if (!fileName.endsWith('.docx')) {
      return NextResponse.json({ error: 'Only .docx files are supported' }, { status: 400 })
    }

    // Read file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse placeholders from DOCX
    let fields: { name: string; type: string; source: string; required: boolean }[] = []
    try {
      const PizZip = (await import('pizzip')).default
      const Docxtemplater = (await import('docxtemplater')).default
      const zip = new PizZip(buffer)
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{', end: '}' },
      })
      const text = doc.getFullText()
      const tags = text.match(/\{([^}]+)\}/g) || []
      const uniqueTags = Array.from(new Set(tags.map((t: string) => t.replace(/[{}]/g, ''))))
      fields = uniqueTags.map((tag: string) => ({
        name: tag,
        type: 'text',
        source: 'manual',
        required: true,
      }))
    } catch (parseError) {
      console.error('[Signing Templates POST] DOCX parse error:', parseError)
      // Continue without fields — template is still valid
    }

    // Upload file to Supabase Storage
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `signing-templates/${userId}/${Date.now()}_${safeName}`

    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

    if (uploadError) {
      console.error('[Signing Templates POST] Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload template file' }, { status: 500 })
    }

    // Insert template record
    const { data: template, error: insertError } = await supabaseAdmin
      .from('signing_templates')
      .insert({
        name,
        created_by: userId,
        file_path: storagePath,
        fields,
        active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Signing Templates POST] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('[Signing Templates POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
