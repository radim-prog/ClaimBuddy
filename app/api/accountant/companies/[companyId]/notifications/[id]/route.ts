import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getFirmId, verifyCompanyAccess } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string; id: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const firmId = getFirmId(request)
  if (!await verifyCompanyAccess(params.companyId, firmId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.status !== undefined) {
      updates.status = body.status
      if (body.status === 'resolved') {
        updates.resolved_at = new Date().toISOString()
      }
    }
    if (body.title !== undefined) updates.title = body.title
    if (body.message !== undefined) updates.message = body.message
    if (body.severity !== undefined) updates.severity = body.severity

    const { data, error } = await supabaseAdmin
      .from('client_notifications')
      .update(updates)
      .eq('id', params.id)
      .eq('company_id', params.companyId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ notification: data })
  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { companyId: string; id: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const firmIdDel = getFirmId(request)
  if (!await verifyCompanyAccess(params.companyId, firmIdDel)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { error } = await supabaseAdmin
      .from('client_notifications')
      .delete()
      .eq('id', params.id)
      .eq('company_id', params.companyId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
