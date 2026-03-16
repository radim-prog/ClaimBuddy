import { NextRequest, NextResponse } from 'next/server'
import { processDueDeliveries } from '@/lib/reminder-engine'

export const dynamic = 'force-dynamic'

// POST /api/cron/reminders — process due reminder deliveries (every 15 min)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processDueDeliveries()
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Reminders cron error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
