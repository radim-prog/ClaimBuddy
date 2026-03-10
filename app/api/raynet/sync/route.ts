import { NextRequest, NextResponse } from 'next/server'
import { syncFromRaynet } from '@/lib/raynet-store'

export const dynamic = 'force-dynamic'

// POST - Manually trigger Raynet sync
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const year = (body as { year?: number }).year || new Date().getFullYear()

    const result = await syncFromRaynet(year)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Raynet sync error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
