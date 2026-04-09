import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

// DELETE /api/claims/files/[id] — soft-delete a document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  try {
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('id, storage_path')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.storage_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('documents')
        .remove([document.storage_path])

      if (storageError) {
        console.warn('[Claims files] storage delete warning:', storageError.message)
      }
    }

    const { error } = await supabaseAdmin
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Claims files] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
