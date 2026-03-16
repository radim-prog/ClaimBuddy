import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// DB schema for invoice_penalties:
// id uuid PK default gen_random_uuid(),
// invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
// company_id uuid NOT NULL,
// type text NOT NULL DEFAULT 'interest' CHECK (type IN ('interest', 'flat_fee', 'custom')),
// rate_per_day numeric NOT NULL DEFAULT 0.0005, -- 0.05% per day (CZ legal default)
// base_amount numeric NOT NULL,
// days_overdue int NOT NULL DEFAULT 0,
// calculated_amount numeric NOT NULL DEFAULT 0,
// forgiven boolean NOT NULL DEFAULT false,
// forgiven_at timestamptz,
// forgiven_by uuid,
// forgiven_reason text,
// created_at timestamptz NOT NULL DEFAULT now(),
// updated_at timestamptz NOT NULL DEFAULT now()

const DEFAULT_RATE_PER_DAY = 0.0005 // 0.05% per day — CZ legal default for commercial relations

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Load configured rate from app_settings (or use default)
    let ratePerDay = DEFAULT_RATE_PER_DAY
    const { data: rateSetting } = await supabaseAdmin
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'penalty_rate_per_day')
      .single()

    if (rateSetting?.setting_value && typeof rateSetting.setting_value === 'number') {
      ratePerDay = rateSetting.setting_value
    }

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Find all unpaid invoices past due
    const { data: unpaidInvoices, error } = await supabaseAdmin
      .from('invoices')
      .select('id, company_id, due_date, total_with_vat')
      .is('paid_at', null)
      .neq('payment_status', 'paid')
      .is('deleted_at', null)
      .lt('due_date', todayStr)

    if (error) throw error

    let created = 0
    let updated = 0
    let skipped = 0

    for (const inv of unpaidInvoices || []) {
      const dueDate = new Date(inv.due_date)
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysOverdue <= 0) {
        skipped++
        continue
      }

      const calculatedAmount = Math.round(inv.total_with_vat * ratePerDay * daysOverdue * 100) / 100

      // Upsert penalty record (one per invoice)
      const { data: existing } = await supabaseAdmin
        .from('invoice_penalties')
        .select('id, forgiven')
        .eq('invoice_id', inv.id)
        .single()

      if (existing) {
        // Don't update forgiven penalties
        if (existing.forgiven) {
          skipped++
          continue
        }
        await supabaseAdmin
          .from('invoice_penalties')
          .update({
            days_overdue: daysOverdue,
            calculated_amount: calculatedAmount,
            rate_per_day: ratePerDay,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        updated++
      } else {
        await supabaseAdmin
          .from('invoice_penalties')
          .insert({
            invoice_id: inv.id,
            company_id: inv.company_id,
            type: 'interest',
            rate_per_day: ratePerDay,
            base_amount: inv.total_with_vat,
            days_overdue: daysOverdue,
            calculated_amount: calculatedAmount,
          })
        created++
      }
    }

    return NextResponse.json({
      processed: (unpaidInvoices || []).length,
      created,
      updated,
      skipped,
      rate_per_day: ratePerDay,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Calculate penalties cron] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
