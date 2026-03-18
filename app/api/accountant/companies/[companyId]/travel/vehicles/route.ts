import { NextRequest, NextResponse } from 'next/server'
import { getVehicles } from '@/lib/travel-store-db'
import { getFirmId, verifyCompanyAccess } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const firmId = getFirmId(request)
  if (!await verifyCompanyAccess(params.companyId, firmId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const vehicles = await getVehicles(params.companyId)
    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error('Accountant travel vehicles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
