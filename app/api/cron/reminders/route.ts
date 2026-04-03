import { NextRequest, NextResponse } from 'next/server'
import { processDueDeliveries } from '@/lib/reminder-engine'
import { verifyCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

// POST /api/cron/reminders — process due reminder deliveries (every 15 min)
export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

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
