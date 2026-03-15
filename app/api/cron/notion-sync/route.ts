import { NextRequest, NextResponse } from 'next/server'
import { runFullSync } from '@/lib/notion-sync'
import { logError } from '@/lib/error-logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  try {
    const result = await runFullSync()
    const duration = Date.now() - startTime
    const totalErrors = [...result.fromNotion.errors, ...result.toNotion.errors]

    logError({
      level: totalErrors.length > 0 ? 'warn' : 'info',
      message: `Notion sync completed in ${duration}ms: from_notion=(created=${result.fromNotion.created}, updated=${result.fromNotion.updated}), to_notion=(created=${result.toNotion.created}, updated=${result.toNotion.updated}), errors=${totalErrors.length}`,
      source: 'notion-sync-cron',
    })

    return NextResponse.json({
      success: true,
      fromNotion: result.fromNotion,
      toNotion: result.toNotion,
      errors: totalErrors,
      duration,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'

    logError({
      level: 'error',
      message: `Notion sync failed after ${duration}ms: ${message}`,
      source: 'notion-sync-cron',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      { error: 'Sync failed', message, duration },
      { status: 500 }
    )
  }
}
