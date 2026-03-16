import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resolveReminder } from '@/lib/reminder-engine'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// PATCH — update reminder status (pause/resume/resolve)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body // 'pause' | 'resume' | 'resolve'

    if (!['pause', 'resume', 'resolve'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use pause, resume, or resolve' }, { status: 400 })
    }

    if (action === 'resolve') {
      const success = await resolveReminder(id)
      if (!success) {
        return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, status: 'resolved' })
    }

    const newStatus = action === 'pause' ? 'paused' : 'active'
    const { data, error } = await supabaseAdmin
      .from('reminders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error('[Reminder PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — delete a reminder and its deliveries
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('reminders')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Reminder DELETE]', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Reminder DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
