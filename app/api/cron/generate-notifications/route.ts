import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendTelegramMessage, formatTaxImpactNotification, formatInvoiceDueNotification } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Auth via CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get deadline_day from settings
    const { data: settingRow } = await supabaseAdmin
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'deadline_day')
      .single()

    const deadlineDay = Number(settingRow?.setting_value) || 15

    const now = new Date()
    const currentDay = now.getDate()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const period = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

    // Only generate if within 7 days of deadline
    if (currentDay < deadlineDay - 7) {
      return NextResponse.json({ created: 0, skipped: 0, errors: 0, message: 'Not within notification window' })
    }

    // Get companies with monthly_reporting and deadline_reminder enabled
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id, name, owner_id, notification_preferences, legal_form, vat_payer')
      .eq('monthly_reporting', true)
      .neq('status', 'inactive')

    let created = 0
    let skipped = 0
    let errors = 0

    for (const company of companies || []) {
      try {
        // Check if deadline_reminder type is enabled
        const prefs = company.notification_preferences as { types?: { deadline_reminder?: boolean } } | null
        if (!prefs?.types?.deadline_reminder) {
          skipped++
          continue
        }

        // Check if notification already exists for this period
        const { data: existing } = await supabaseAdmin
          .from('client_notifications')
          .select('id')
          .eq('company_id', company.id)
          .eq('type', 'deadline_reminder')
          .contains('metadata', { period })
          .limit(1)

        if (existing && existing.length > 0) {
          skipped++
          continue
        }

        // Check if company has missing closures for current period
        const { data: closures } = await supabaseAdmin
          .from('closures')
          .select('bank_statement_status, expense_documents_status, income_invoices_status')
          .eq('company_id', company.id)
          .eq('period', period)
          .limit(1)

        const closure = closures?.[0]
        if (!closure) {
          skipped++
          continue
        }

        const hasMissing =
          closure.bank_statement_status === 'missing' ||
          closure.expense_documents_status === 'missing' ||
          closure.income_invoices_status === 'missing'

        if (!hasMissing) {
          skipped++
          continue
        }

        // Create notification
        const daysLeft = deadlineDay - currentDay
        const { error } = await supabaseAdmin
          .from('client_notifications')
          .insert({
            company_id: company.id,
            type: 'deadline_reminder',
            title: `Blíží se termín pro podklady - ${period}`,
            message: daysLeft > 0
              ? `Do ${deadlineDay}. tohoto měsíce prosím dodejte chybějící podklady za období ${period}. Zbývá ${daysLeft} dní.`
              : `Termín pro dodání podkladů za období ${period} již uplynul. Prosím dodejte co nejdříve.`,
            severity: daysLeft <= 0 ? 'urgent' : daysLeft <= 3 ? 'warning' : 'info',
            auto_generated: true,
            metadata: { period },
          })

        if (error) {
          errors++
        } else {
          created++
        }

        // ── NEW: Bank transaction tax impact alerts ──
        const { data: unmatchedTxs } = await supabaseAdmin
          .from('bank_transactions')
          .select('tax_impact, vat_impact')
          .eq('company_id', company.id)
          .eq('period', period)
          .is('matched_document_id', null)
          .lt('amount', 0) // only expenses

        if (unmatchedTxs && unmatchedTxs.length > 0) {
          const totalTax = unmatchedTxs.reduce((s, t) => s + (Number(t.tax_impact) || 0), 0)
          const totalVat = unmatchedTxs.reduce((s, t) => s + (Number(t.vat_impact) || 0), 0)

          if (totalTax + totalVat > 0) {
            // Check if tax impact notification already sent
            const { data: taxExisting } = await supabaseAdmin
              .from('client_notifications')
              .select('id')
              .eq('company_id', company.id)
              .eq('type', 'missing_document_tax_impact')
              .contains('metadata', { period })
              .limit(1)

            if (!taxExisting || taxExisting.length === 0) {
              await supabaseAdmin
                .from('client_notifications')
                .insert({
                  company_id: company.id,
                  type: 'missing_document_tax_impact',
                  title: `Nespárované výdaje — dopad ${Math.round(totalTax + totalVat).toLocaleString('cs-CZ')} Kč`,
                  message: `Máte ${unmatchedTxs.length} nespárovaných výdajů za ${period}. Daňový dopad: ${Math.round(totalTax).toLocaleString('cs-CZ')} Kč (DzP) + ${Math.round(totalVat).toLocaleString('cs-CZ')} Kč (DPH).`,
                  severity: totalTax + totalVat > 10000 ? 'urgent' : 'warning',
                  auto_generated: true,
                  metadata: { period, unmatched_count: unmatchedTxs.length, tax_impact: totalTax, vat_impact: totalVat },
                })
              created++

              // Send Telegram if owner has it configured
              if (company.owner_id) {
                const { data: owner } = await supabaseAdmin
                  .from('users')
                  .select('telegram_chat_id, notification_preferences')
                  .eq('id', company.owner_id)
                  .single()

                const ownerPrefs = owner?.notification_preferences as any
                if (owner?.telegram_chat_id && ownerPrefs?.telegram && ownerPrefs?.types?.missing_document_tax_impact) {
                  await sendTelegramMessage(
                    owner.telegram_chat_id,
                    formatTaxImpactNotification(company.name, unmatchedTxs.length, totalTax, totalVat)
                  )
                }
              }
            }
          }
        }

        // ── NEW: Invoice due reminders ──
        const threeDaysFromNow = new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0]
        const { data: dueSoonInvoices } = await supabaseAdmin
          .from('invoices')
          .select('id, invoice_number, total_with_vat, due_date')
          .eq('company_id', company.id)
          .eq('payment_status', 'unpaid')
          .lte('due_date', threeDaysFromNow)
          .is('deleted_at', null)

        for (const inv of dueSoonInvoices || []) {
          const { data: invExisting } = await supabaseAdmin
            .from('client_notifications')
            .select('id')
            .eq('company_id', company.id)
            .eq('type', 'invoice_due_reminder')
            .contains('metadata', { invoice_id: inv.id })
            .limit(1)

          if (!invExisting || invExisting.length === 0) {
            const invDaysLeft = Math.ceil((new Date(inv.due_date).getTime() - now.getTime()) / 86400000)

            await supabaseAdmin
              .from('client_notifications')
              .insert({
                company_id: company.id,
                type: 'invoice_due_reminder',
                title: `Splatnost faktury ${inv.invoice_number}`,
                message: invDaysLeft > 0
                  ? `Faktura ${inv.invoice_number} na ${Number(inv.total_with_vat).toLocaleString('cs-CZ')} Kč je splatná za ${invDaysLeft} dní.`
                  : `Faktura ${inv.invoice_number} na ${Number(inv.total_with_vat).toLocaleString('cs-CZ')} Kč je po splatnosti!`,
                severity: invDaysLeft <= 0 ? 'urgent' : 'warning',
                auto_generated: true,
                metadata: { invoice_id: inv.id, invoice_number: inv.invoice_number },
              })
            created++

            // Telegram for invoice due
            if (company.owner_id) {
              const { data: owner } = await supabaseAdmin
                .from('users')
                .select('telegram_chat_id, notification_preferences')
                .eq('id', company.owner_id)
                .single()

              const ownerPrefs = owner?.notification_preferences as any
              if (owner?.telegram_chat_id && ownerPrefs?.telegram && ownerPrefs?.types?.invoice_due_reminder) {
                await sendTelegramMessage(
                  owner.telegram_chat_id,
                  formatInvoiceDueNotification(inv.invoice_number, Number(inv.total_with_vat), inv.due_date, invDaysLeft)
                )
              }
            }
          }
        }
      } catch {
        errors++
      }
    }

    return NextResponse.json({ created, skipped, errors })
  } catch (error) {
    console.error('Generate notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
