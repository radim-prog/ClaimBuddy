import { NextRequest, NextResponse } from 'next/server'
import { calculateAllHealthScores } from '@/lib/health-score-engine'

export const dynamic = 'force-dynamic'

// GET - Nightly batch recalculation of all health scores
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await calculateAllHealthScores()
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health scores cron error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
