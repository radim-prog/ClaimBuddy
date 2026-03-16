import { NextRequest, NextResponse } from 'next/server'
import { logUsage } from '@/lib/subscription-store'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await request.json()
  if (!['upsell_shown', 'upsell_clicked'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  await logUsage(userId, action)
  return NextResponse.json({ ok: true })
}
