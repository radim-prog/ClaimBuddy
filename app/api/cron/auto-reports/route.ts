import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email-service'
import { reportEmailTemplate, type ReportKpi } from '@/lib/email-templates'

export const dynamic = 'force-dynamic'

const CRON_SECRET = process.env.CRON_SECRET

// Report type labels for email subjects
const REPORT_LABELS: Record<string, string> = {
  weekly_summary: 'Týdenní přehled',
  monthly_summary: 'Měsíční přehled',
  dph_status: 'Přehled DPH',
  payment_status: 'Stav plateb',
}

// GET /api/cron/auto-reports — called daily by external cron
export async function GET(request: NextRequest) {
  // Fail-closed auth
  if (!CRON_SECRET) {
    console.error('CRON_SECRET is not configured — rejecting cron request')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  const secret = request.headers.get('x-cron-secret')
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon
  const dayOfMonth = now.getDate()
  const isMonday = dayOfWeek === 1
  const isFirstOfMonth = dayOfMonth === 1

  // Determine which frequencies to process today
  const frequencies: string[] = []
  if (isMonday) frequencies.push('weekly')
  if (isFirstOfMonth) frequencies.push('monthly')

  if (frequencies.length === 0) {
    return NextResponse.json({ message: 'No reports due today', sent: 0 })
  }

  try {
    // Fetch all enabled subscriptions for due frequencies
    const { data: subscriptions, error } = await supabaseAdmin
      .from('report_subscriptions')
      .select('*, users!user_id(id, name, email)')
      .eq('enabled', true)
      .in('frequency', frequencies)

    if (error) throw error
    if (!subscriptions?.length) {
      return NextResponse.json({ message: 'No active subscriptions', sent: 0 })
    }

    // Gather report data once (shared across all recipients)
    const reportData = await gatherReportData()

    let sentCount = 0
    const errors: string[] = []

    for (const sub of subscriptions) {
      try {
        const user = sub.users as { id: string; name: string; email: string } | null
        if (!user) continue

        const recipientEmail = sub.email || user.email
        const reportType = sub.report_type as string
        const reportLabel = REPORT_LABELS[reportType] || 'Přehled'

        const periodLabel = sub.frequency === 'weekly'
          ? `Týden ${getWeekNumber(now)}/${now.getFullYear()}`
          : `${now.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}`

        const { kpis, tableRows } = buildReport(reportType, reportData)

        const template = reportEmailTemplate(
          user.name,
          reportLabel,
          periodLabel,
          kpis,
          tableRows,
          'https://app.zajcon.cz/accountant/analytics'
        )

        await sendEmail({
          to: recipientEmail,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })

        // Update last_sent_at
        await supabaseAdmin
          .from('report_subscriptions')
          .update({ last_sent_at: now.toISOString(), updated_at: now.toISOString() })
          .eq('id', sub.id)

        sentCount++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`Sub ${sub.id}: ${msg}`)
        console.error(`[AutoReports] Error sending to sub ${sub.id}:`, err)
      }
    }

    return NextResponse.json({
      message: `Reports sent`,
      sent: sentCount,
      total: subscriptions.length,
      frequencies,
      ...(errors.length > 0 && { errors }),
    })
  } catch (error) {
    console.error('[AutoReports] Cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// Data gathering
// ---------------------------------------------------------------------------

interface ReportData {
  activeClients: number
  currentMRR: number
  unpaidInvoices: number
  unpaidAmount: number
  openClosures: number
  totalClosures: number
  dphPending: number
  paymentsThisMonth: number
  paymentsTotal: number
}

async function gatherReportData(): Promise<ReportData> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  // Parallel queries
  const [companiesRes, invoicesRes, closuresRes, vatRes, paymentsRes, billingRes] = await Promise.all([
    // Active companies
    supabaseAdmin
      .from('companies')
      .select('id, billing_settings', { count: 'exact', head: false })
      .eq('status', 'active')
      .is('deleted_at', null),

    // Unpaid invoices
    supabaseAdmin
      .from('invoices')
      .select('id, total_with_vat', { count: 'exact', head: false })
      .is('paid_at', null)
      .neq('payment_status', 'paid'),

    // Closures for current period
    supabaseAdmin
      .from('closures')
      .select('id, status', { count: 'exact', head: false })
      .eq('period', `${year}-${month}`),

    // Pending VAT returns
    supabaseAdmin
      .from('vat_returns')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Monthly payments
    supabaseAdmin
      .from('monthly_payments')
      .select('id, paid', { count: 'exact', head: false })
      .eq('period', `${year}-${month}`),

    // billing_configs for MRR
    supabaseAdmin
      .from('billing_configs')
      .select('company_id, monthly_fee_czk')
      .eq('status', 'active'),
  ])

  const companies = companiesRes.data || []
  const invoices = invoicesRes.data || []
  const closures = closuresRes.data || []
  const payments = paymentsRes.data || []
  const billingConfigs = billingRes.data || []

  // MRR: prefer billing_configs, fallback billing_settings
  const configMap = new Map(billingConfigs.map(bc => [bc.company_id, bc.monthly_fee_czk]))
  let mrr = 0
  for (const c of companies) {
    mrr += configMap.get(c.id) ?? Number(c.billing_settings?.monthly_fee || 0)
  }

  return {
    activeClients: companies.length,
    currentMRR: mrr,
    unpaidInvoices: invoices.length,
    unpaidAmount: invoices.reduce((s, i) => s + (Number(i.total_with_vat) || 0), 0),
    openClosures: closures.filter(c => c.status !== 'completed').length,
    totalClosures: closures.length,
    dphPending: vatRes.count || 0,
    paymentsThisMonth: payments.filter(p => p.paid).length,
    paymentsTotal: payments.length,
  }
}

// ---------------------------------------------------------------------------
// Report builders
// ---------------------------------------------------------------------------

function buildReport(
  reportType: string,
  data: ReportData
): { kpis: ReportKpi[]; tableRows: { label: string; value: string }[] } {
  const fmtCzk = (n: number) => `${n.toLocaleString('cs-CZ')} Kč`

  switch (reportType) {
    case 'weekly_summary':
    case 'monthly_summary':
      return {
        kpis: [
          { label: 'MRR', value: fmtCzk(data.currentMRR), color: '#2563eb' },
          { label: 'Aktivních klientů', value: String(data.activeClients), color: '#16a34a' },
          { label: 'Neplacených faktur', value: String(data.unpaidInvoices), color: data.unpaidInvoices > 0 ? '#dc2626' : '#16a34a' },
        ],
        tableRows: [
          { label: 'Neplacené faktury (celkem)', value: fmtCzk(data.unpaidAmount) },
          { label: 'Otevřené uzávěrky', value: `${data.openClosures} / ${data.totalClosures}` },
          { label: 'Platby tento měsíc', value: `${data.paymentsThisMonth} / ${data.paymentsTotal}` },
          { label: 'DPH ke zpracování', value: String(data.dphPending) },
        ],
      }

    case 'dph_status':
      return {
        kpis: [
          { label: 'DPH ke zpracování', value: String(data.dphPending), color: data.dphPending > 0 ? '#d97706' : '#16a34a' },
          { label: 'Aktivních plátců', value: String(data.activeClients), color: '#2563eb' },
        ],
        tableRows: [
          { label: 'Otevřené uzávěrky', value: `${data.openClosures} / ${data.totalClosures}` },
        ],
      }

    case 'payment_status':
      return {
        kpis: [
          { label: 'Neplacených faktur', value: String(data.unpaidInvoices), color: data.unpaidInvoices > 0 ? '#dc2626' : '#16a34a' },
          { label: 'Dlužná částka', value: fmtCzk(data.unpaidAmount), color: '#dc2626' },
          { label: 'Platby měsíc', value: `${data.paymentsThisMonth}/${data.paymentsTotal}`, color: '#2563eb' },
        ],
        tableRows: [
          { label: 'MRR', value: fmtCzk(data.currentMRR) },
          { label: 'Aktivních klientů', value: String(data.activeClients) },
        ],
      }

    default:
      return { kpis: [], tableRows: [] }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
