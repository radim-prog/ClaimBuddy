import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTravelStats } from '@/lib/travel-store-db'

export const dynamic = 'force-dynamic'

async function getCompanyIds(userId: string, impersonateCompany: string | null): Promise<string[]> {
  if (impersonateCompany) return [impersonateCompany]
  const { data } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('owner_id', userId)
    .is('deleted_at', null)
  return (data ?? []).map(c => c.id)
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getCompanyIds(userId, request.headers.get('x-impersonate-company'))
    if (companyIds.length === 0) {
      return NextResponse.json({
        stats: { total_trips: 0, total_km: 0, total_reimbursement: 0, total_fuel_cost: 0, business_km: 0, private_km: 0, trips_by_vehicle: [] }
      })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined

    const stats = await getTravelStats(companyIds[0], { year, month })
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Client travel stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
