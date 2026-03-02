import { NextRequest, NextResponse } from 'next/server'
import { getTravelStats } from '@/lib/travel-store-db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined

    const stats = await getTravelStats(params.companyId, { year, month })
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Accountant travel stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
