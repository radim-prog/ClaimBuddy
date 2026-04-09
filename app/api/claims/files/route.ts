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
      .select('id, file_name, storage_path, file_size_bytes, mime_type, uploaded_at, uploaded_by')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const uploaderIds = Array.from(new Set((data ?? []).map((doc) => doc.uploaded_by).filter(Boolean)))
    const uploaderNames = new Map()

    if (uploaderIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .in('id', uploaderIds)

      if (usersError) throw usersError

      for (const user of users ?? []) {
        uploaderNames.set(user.id, user.name)
      }
    }

    const files = await Promise.all((data ?? []).map(async (d) => {
      let fileUrl: string | null = null

      if (d.storage_path) {
        const { data: signedData, error: signedError } = await supabaseAdmin.storage
          .from('documents')
          .createSignedUrl(d.storage_path, 3600)

        if (!signedError && signedData?.signedUrl) {
          fileUrl = signedData.signedUrl
        }
      }

      return {
        id: d.id,
        filename: d.file_name || 'Neznámý soubor',
        file_url: fileUrl,
        file_size: d.file_size_bytes,
        mime_type: d.mime_type,
        uploaded_at: d.uploaded_at,
        uploaded_by: d.uploaded_by ? (uploaderNames.get(d.uploaded_by) || d.uploaded_by) : null,
      }
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

    const { data: signedData } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600)

    const { data: doc, error: dbErr } = await supabaseAdmin
      .from('documents')
      .insert({
        company_id: companyId,
        period: new Date().toISOString().slice(0, 7),
        type: 'other',
        file_name: file.name,
        storage_path: storagePath,
        file_size_bytes: file.size,
        mime_type: file.type,
        status: 'uploaded',
        uploaded_by: userId,
        upload_source: 'api',
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbErr) throw dbErr

    return NextResponse.json({
      file: {
        id: doc.id,
        filename: doc.file_name,
        file_url: signedData?.signedUrl || null,
        file_size: doc.file_size_bytes,
        mime_type: doc.mime_type,
        uploaded_at: doc.uploaded_at,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[Claims files] POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
