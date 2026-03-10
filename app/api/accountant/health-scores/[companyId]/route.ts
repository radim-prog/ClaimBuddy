import { NextRequest, NextResponse } from 'next/server'
import { calculateHealthScore } from '@/lib/health-score-engine'

export const dynamic = 'force-dynamic'

// GET - fresh health score calculation for a single company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { companyId } = await params
    const result = await calculateHealthScore(companyId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Health score calculation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
