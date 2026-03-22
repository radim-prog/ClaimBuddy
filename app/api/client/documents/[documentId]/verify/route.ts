import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId } = await params

  try {
    const body = await request.json()
    const { verified, corrections } = body

    if (typeof verified !== 'boolean') {
      return NextResponse.json({ error: 'Missing verified field' }, { status: 400 })
    }

    // Fetch document and verify ownership
    const { data: doc, error: fetchErr } = await supabaseAdmin
      .from('documents')
      .select('id, company_id, ocr_status, ocr_data')
      .eq('id', documentId)
      .is('deleted_at', null)
      .single()

    if (fetchErr || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Verify company ownership
    const impersonateCompany = request.headers.get('x-impersonate-company')
    let companyIds: string[] = []

    if (impersonateCompany) {
      companyIds = [impersonateCompany]
    } else {
      const { data: companies } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('owner_id', userId)
        .is('deleted_at', null)

      companyIds = (companies ?? []).map(c => c.id)
    }

    if (!companyIds.includes(doc.company_id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build update
    const update: Record<string, unknown> = {
      ocr_status: verified ? 'client_verified' : doc.ocr_status,
    }

    // Merge corrections into ocr_data if provided
    if (corrections && typeof corrections === 'object') {
      const existingOcrData = (doc.ocr_data as Record<string, unknown>) || {}
      update.ocr_data = {
        ...existingOcrData,
        client_corrections: corrections,
        client_verified_at: new Date().toISOString(),
        client_verified_by: userId,
      }
    } else if (verified) {
      const existingOcrData = (doc.ocr_data as Record<string, unknown>) || {}
      update.ocr_data = {
        ...existingOcrData,
        client_verified_at: new Date().toISOString(),
        client_verified_by: userId,
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from('documents')
      .update(update)
      .eq('id', documentId)

    if (updateErr) throw new Error(updateErr.message)

    return NextResponse.json({
      success: true,
      ocr_status: update.ocr_status,
    })
  } catch (error) {
    console.error('Document verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
