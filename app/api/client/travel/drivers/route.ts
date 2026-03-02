import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDrivers, createDriver } from '@/lib/travel-store-db'

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
    if (companyIds.length === 0) return NextResponse.json({ drivers: [] })

    const drivers = await getDrivers(companyIds[0])
    return NextResponse.json({ drivers })
  } catch (error) {
    console.error('Client drivers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getCompanyIds(userId, request.headers.get('x-impersonate-company'))
    if (companyIds.length === 0) return NextResponse.json({ error: 'No company found' }, { status: 400 })

    const body = await request.json()
    const driver = await createDriver({
      company_id: companyIds[0],
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      license_number: body.license_number || null,
      is_default: body.is_default || false,
      is_active: true,
    })

    return NextResponse.json({ driver }, { status: 201 })
  } catch (error) {
    console.error('Create driver error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
