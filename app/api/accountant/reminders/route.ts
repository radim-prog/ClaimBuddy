import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { scheduleReminder, type ReminderFrequency, type DeliveryChannel } from '@/lib/reminder-engine'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET — list reminders with filters
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const status = searchParams.get('status') // active, resolved, expired, paused
    const type = searchParams.get('type') // deadline, missing_docs, unpaid_invoice, custom
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)
    const offset = Number(searchParams.get('offset')) || 0

    let query = supabaseAdmin
      .from('reminders')
      .select('*, companies(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (companyId) query = query.eq('company_id', companyId)
    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)

    const { data: reminders, count, error } = await query

    if (error) {
      console.error('[Reminders GET]', error)
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
    }

    // Get delivery stats per reminder
    const reminderIds = (reminders || []).map(r => r.id)
    let deliveryStats: Record<string, { total: number; delivered: number; failed: number; pending: number }> = {}

    if (reminderIds.length > 0) {
      const { data: deliveries } = await supabaseAdmin
        .from('reminder_deliveries')
        .select('reminder_id, status')
        .in('reminder_id', reminderIds)

      for (const d of deliveries || []) {
        if (!deliveryStats[d.reminder_id]) {
          deliveryStats[d.reminder_id] = { total: 0, delivered: 0, failed: 0, pending: 0 }
        }
        deliveryStats[d.reminder_id].total++
        if (d.status === 'delivered') deliveryStats[d.reminder_id].delivered++
        else if (d.status === 'failed') deliveryStats[d.reminder_id].failed++
        else if (d.status === 'pending') deliveryStats[d.reminder_id].pending++
      }
    }

    const enriched = (reminders || []).map(r => ({
      ...r,
      company_name: (r as any).companies?.name || null,
      delivery_stats: deliveryStats[r.id] || { total: 0, delivered: 0, failed: 0, pending: 0 },
    }))

    return NextResponse.json({ reminders: enriched, total: count })
  } catch (error) {
    console.error('[Reminders GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create a new reminder (from any trigger point)
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { company_id, type, message, frequency, channels, metadata, max_deliveries } = body

    if (!company_id || !message) {
      return NextResponse.json({ error: 'company_id and message required' }, { status: 400 })
    }

    const validTypes = ['deadline', 'missing_docs', 'unpaid_invoice', 'custom']
    if (type && !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const reminder = await scheduleReminder({
      companyId: company_id,
      type: type || 'custom',
      message,
      frequency: (frequency as ReminderFrequency) || 'adaptive',
      channels: (channels as DeliveryChannel[]) || ['in_app'],
      metadata: metadata || {},
      maxDeliveries: max_deliveries || 20,
      createdBy: userId,
    })

    if (!reminder) {
      return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
    }

    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error) {
    console.error('[Reminders POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
