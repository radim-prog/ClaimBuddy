import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { getInsuranceCase, getCaseDocuments, addCaseDocument } from '@/lib/insurance-store'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ caseId: string }> }

// GET /api/claims/cases/[caseId]/documents
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId } = await params

  try {
    // IDOR check
    const caseData = await getInsuranceCase(caseId)
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (userRole !== 'admin' && caseData.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const documents = await getCaseDocuments(caseId)
    return NextResponse.json({ documents })
  } catch (error) {
    console.error('[Claims documents] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/claims/cases/[caseId]/documents — upload file via FormData
export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId } = await params

  try {
    // IDOR check
    const caseData = await getInsuranceCase(caseId)
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (userRole !== 'admin' && caseData.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentType = (formData.get('document_type') as string) || 'other'
    const note = formData.get('note') as string | null

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `claims/cases/${caseId}/${timestamp}_${safeName}`

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

    // Save document record via insurance-store
    const doc = await addCaseDocument({
      case_id: caseId,
      name: file.name,
      file_path: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
      document_type: documentType,
      uploaded_by: userId,
      note: note ?? undefined,
    })

    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (error) {
    console.error('[Claims documents] POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
