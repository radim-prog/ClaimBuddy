import { NextRequest, NextResponse } from 'next/server'
import { syncFromRaynet, createMonthlyBCs } from '@/lib/raynet-store'
import { verifyCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

// POST - Cron endpoint for Raynet sync (called by systemd timer or node-cron)
export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  // Check working hours (8:00-20:00)
  const now = new Date()
  const hour = now.getHours()
  if (hour < 8 || hour >= 20) {
    return NextResponse.json({ skipped: true, reason: 'Outside working hours (8-20)' })
  }

  try {
    const currentYear = now.getFullYear()
    const result = await syncFromRaynet(currentYear)

    // 1st day of month: auto-create BCs
    let createdBCs = 0
    if (now.getDate() === 1) {
      const period = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`
      createdBCs = await createMonthlyBCs(period)
    }

    return NextResponse.json({
      ...result,
      createdBCs,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Raynet cron sync error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
