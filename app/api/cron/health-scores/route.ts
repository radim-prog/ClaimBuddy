import { NextRequest, NextResponse } from 'next/server'
import { calculateAllHealthScores } from '@/lib/health-score-engine'
import { verifyCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

// POST - Nightly batch recalculation of all health scores
export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

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
