import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin' && userRole !== 'accountant' && userRole !== 'assistant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id: projectId, docId } = await params
    const body = await request.json()

    const updates: Record<string, unknown> = {}
    if (body.client_visible !== undefined) updates.client_visible = body.client_visible
    if (body.name !== undefined) updates.name = body.name
    if (body.category !== undefined) updates.category = body.category
    if (body.description !== undefined) updates.description = body.description

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('case_documents')
      .update(updates)
      .eq('id', docId)
      .eq('project_id', projectId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    // Log change for auditing
    if (body.client_visible !== undefined) {
      await supabaseAdmin.from('case_document_changes').insert({
        document_id: docId,
        changed_by: userId,
        changed_by_name: userName || 'Unknown',
        change_type: 'visibility_changed',
        old_values: { client_visible: !body.client_visible },
        new_values: { client_visible: body.client_visible },
        change_summary: body.client_visible ? 'Made visible to client' : 'Hidden from client',
      }).then(({ error: auditErr }) => {
        if (auditErr) console.error('Audit log failed:', auditErr)
      })
    }

    return NextResponse.json({ document: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
