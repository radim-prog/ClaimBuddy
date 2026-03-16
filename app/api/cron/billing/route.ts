import { NextRequest, NextResponse } from 'next/server'
import { generateMonthlyInvoices, processOverdueInvoices, generatePayouts } from '@/lib/billing-service'

export const dynamic = 'force-dynamic'

// Cron: runs monthly (1st of month) and daily (for dunning)
// POST /api/cron/billing?action=generate|dunning|payouts|all
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const action = url.searchParams.get('action') || 'all'

  const results: Record<string, unknown> = {}

  try {
    // Current period (YYYY-MM)
    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Previous period for payouts (payouts are for the already-completed month)
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`

    if (action === 'generate' || action === 'all') {
      results.invoices = await generateMonthlyInvoices(currentPeriod)
    }

    if (action === 'dunning' || action === 'all') {
      results.dunning = await processOverdueInvoices()
    }

    if (action === 'payouts' || action === 'all') {
      results.payouts = await generatePayouts(prevPeriod)
    }

    console.log(`[Billing cron] action=${action}, period=${currentPeriod}, results=`, JSON.stringify(results))

    return NextResponse.json({ success: true, period: currentPeriod, ...results })
  } catch (error) {
    console.error('[Billing cron] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
