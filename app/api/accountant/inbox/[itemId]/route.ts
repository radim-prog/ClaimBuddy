import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { updateDocumentInboxItemStatus } from '@/lib/document-inbox-store'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ itemId: string }> }

/** Check that a non-admin user has access to the company owning this inbox item. */
async function canAccessItem(
  userId: string,
  userRole: string | null,
  itemCompanyId: string
): Promise<boolean> {
  if (userRole === 'admin') return true
  const { data } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('id', itemCompanyId)
    .eq('assigned_accountant_id', userId)
    .is('deleted_at', null)
    .maybeSingle()
  return !!data
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || !isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { itemId } = await params

  const { data, error } = await supabaseAdmin
    .from('document_inbox_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // IDOR: verify the item belongs to a company this user can access
  if (!(await canAccessItem(userId, userRole, data.company_id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ item: data })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || !isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { itemId } = await params
  const body = await request.json()
  const { status } = body

  if (!['processing', 'imported', 'failed', 'ignored'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // IDOR: fetch item first and verify ownership
  const { data: item, error: fetchError } = await supabaseAdmin
    .from('document_inbox_items')
    .select('company_id')
    .eq('id', itemId)
    .single()

  if (fetchError || !item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!(await canAccessItem(userId, userRole, item.company_id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await updateDocumentInboxItemStatus(itemId, status, {
      processed_by: userId,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Inbox item update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
