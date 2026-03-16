import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const TABLES_WITH_SOFT_DELETE = ['documents', 'invoices', 'tasks', 'projects', 'invoice_partners']

// POST — permanently delete items older than retention period
// Called by external cron (e.g. daily at 3:00 AM)
export async function POST(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get global retention setting (maybeSingle avoids PGRST116 when table is empty)
    const { data: settings } = await supabaseAdmin
      .from('trash_settings')
      .select('retention_days')
      .is('company_id', null)
      .maybeSingle()

    const retentionDays = settings?.retention_days || 30
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    const cutoff = cutoffDate.toISOString()

    const results: Record<string, number> = {}

    for (const table of TABLES_WITH_SOFT_DELETE) {
      const { count } = await supabaseAdmin
        .from(table)
        .delete({ count: 'exact' })
        .not('deleted_at', 'is', null)
        .lt('deleted_at', cutoff)

      results[table] = count || 0
    }

    const totalPurged = Object.values(results).reduce((a, b) => a + b, 0)

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      retention_days: retentionDays,
      purged: results,
      total_purged: totalPurged,
    })
  } catch (error) {
    console.error('[PurgeTrash] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
