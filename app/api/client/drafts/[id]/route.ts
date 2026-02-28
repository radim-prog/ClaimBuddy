import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// PATCH - update draft (auto-save corrections, confirm/submit)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    // Verify ownership
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('id, uploaded_by, company_id')
      .eq('id', id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check user owns the company
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', doc.company_id)
      .eq('owner_id', userId)
      .single()

    if (!company && doc.uploaded_by !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.extracted_data !== undefined) {
      updates.ocr_data = body.extracted_data
      updates.supplier_name = body.extracted_data?.supplier_name || null
      updates.supplier_ico = body.extracted_data?.supplier_ico || null
    }

    if (body.status === 'submitted') {
      updates.ocr_status = 'submitted'
    }

    const { error } = await supabaseAdmin
      .from('documents')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('[Client Drafts PATCH] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Client Drafts PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - remove a draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    // Soft delete — only if still draft
    const { error } = await supabaseAdmin
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('ocr_status', 'draft')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Client Drafts DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
