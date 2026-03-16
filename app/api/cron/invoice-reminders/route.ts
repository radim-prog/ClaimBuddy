import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { scheduleReminder, resolveReminder } from '@/lib/reminder-engine'
import type { DeliveryChannel } from '@/lib/reminder-engine'

export const dynamic = 'force-dynamic'

// Escalation schedule: days overdue → level
const ESCALATION_SCHEDULE = [
  { daysOverdue: 7,  level: 0, channels: ['in_app', 'email'] as DeliveryChannel[] },
  { daysOverdue: 14, level: 1, channels: ['in_app', 'email'] as DeliveryChannel[] },
  { daysOverdue: 21, level: 2, channels: ['in_app', 'email', 'sms'] as DeliveryChannel[] },
  { daysOverdue: 30, level: 3, channels: ['in_app', 'email', 'sms'] as DeliveryChannel[] },
  { daysOverdue: 45, level: 4, channels: ['in_app', 'email', 'sms', 'whatsapp'] as DeliveryChannel[] },
]

// POST /api/cron/invoice-reminders — daily check for unpaid invoices, create/escalate reminders
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()

    // 1. Find all unpaid, non-deleted invoices past due date
    const { data: unpaidInvoices, error } = await supabaseAdmin
      .from('invoices')
      .select('id, company_id, invoice_number, due_date, total_with_vat, variable_symbol')
      .is('paid_at', null)
      .neq('payment_status', 'paid')
      .is('deleted_at', null)
      .lt('due_date', today.toISOString().split('T')[0])

    if (error) throw error

    let scheduled = 0
    let resolved = 0
    let skipped = 0

    // 2. Check existing reminders for these invoices
    const invoiceIds = (unpaidInvoices || []).map(inv => inv.id)

    const { data: existingReminders } = await supabaseAdmin
      .from('reminders')
      .select('id, metadata, escalation_level, status')
      .eq('type', 'unpaid_invoice')
      .in('status', ['active', 'paused'])

    const reminderByInvoice = new Map<string, { id: string; level: number }>()
    for (const r of existingReminders || []) {
      const meta = r.metadata as Record<string, unknown>
      if (meta?.invoice_id && typeof meta.invoice_id === 'string') {
        reminderByInvoice.set(meta.invoice_id, { id: r.id, level: r.escalation_level })
      }
    }

    // 3. Process each unpaid invoice
    for (const inv of unpaidInvoices || []) {
      const dueDate = new Date(inv.due_date)
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      // Find appropriate escalation level
      const escalation = [...ESCALATION_SCHEDULE]
        .reverse()
        .find(e => daysOverdue >= e.daysOverdue)

      if (!escalation) {
        skipped++
        continue
      }

      const existing = reminderByInvoice.get(inv.id)

      if (existing) {
        // Already has reminder — check if needs escalation
        if (existing.level < escalation.level) {
          // Escalate: update level
          await supabaseAdmin
            .from('reminders')
            .update({
              escalation_level: escalation.level,
              channels: escalation.channels,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
          scheduled++
        } else {
          skipped++
        }
      } else {
        // New reminder
        await scheduleReminder({
          companyId: inv.company_id,
          type: 'unpaid_invoice',
          message: `Faktura ${inv.invoice_number} (${inv.total_with_vat} Kč) je po splatnosti ${daysOverdue} dní.`,
          frequency: 'weekly',
          channels: escalation.channels,
          escalationLevel: escalation.level,
          maxDeliveries: 10,
          metadata: {
            invoice_id: inv.id,
            invoice_number: inv.invoice_number,
            amount: inv.total_with_vat,
            due_date: inv.due_date,
            variable_symbol: inv.variable_symbol,
          },
        })
        scheduled++
      }
    }

    // 4. Resolve reminders for invoices that have been paid
    for (const [invoiceId, reminder] of reminderByInvoice) {
      if (!invoiceIds.includes(invoiceId)) {
        // Invoice is no longer in unpaid list — resolve its reminder
        await resolveReminder(reminder.id)
        resolved++
      }
    }

    return NextResponse.json({
      processed: (unpaidInvoices || []).length,
      scheduled,
      resolved,
      skipped,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Invoice reminders cron] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
