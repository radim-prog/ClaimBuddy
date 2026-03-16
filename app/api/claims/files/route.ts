import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET /api/claims/files?company_id=<uuid>
// Returns documents for a company (claims context)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  if (!companyId) return NextResponse.json({ error: 'company_id is required' }, { status: 400 })

  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, original_name, file_path, file_size, mime_type, created_at, uploaded_by')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    // Map to frontend expected format
    const files = (data ?? []).map(d => ({
      id: d.id,
      filename: d.original_name || 'Neznámý soubor',
      file_url: d.file_path || '',
      file_size: d.file_size,
      mime_type: d.mime_type,
      uploaded_at: d.created_at,
      uploaded_by: d.uploaded_by,
    }))

    return NextResponse.json({ files })
  } catch (error) {
    console.error('[Claims files] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/claims/files — upload a file for a company
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const companyId = formData.get('company_id') as string | null

    if (!file || !companyId) {
      return NextResponse.json({ error: 'file and company_id are required' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `claims/${companyId}/${timestamp}_${safeName}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadErr) throw uploadErr

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(storagePath)

    // Insert document record
    const { data: doc, error: dbErr } = await supabaseAdmin
      .from('documents')
      .insert({
        company_id: companyId,
        original_name: file.name,
        file_path: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        status: 'uploaded',
        uploaded_by: userId,
        source: 'claims_upload',
      })
      .select()
      .single()

    if (dbErr) throw dbErr

    return NextResponse.json({
      file: {
        id: doc.id,
        filename: doc.original_name,
        file_url: doc.file_path,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        uploaded_at: doc.created_at,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[Claims files] POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
