import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getPlaces, createPlace } from '@/lib/travel-store-db'

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
    if (companyIds.length === 0) return NextResponse.json({ places: [] })

    const places = await getPlaces(companyIds[0])
    return NextResponse.json({ places })
  } catch (error) {
    console.error('Client places error:', error)
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
    const place = await createPlace({
      company_id: companyIds[0],
      name: body.name,
      address: body.address || null,
      is_favorite: body.is_favorite || false,
      visit_count: 0,
      last_visited_at: null,
    })

    return NextResponse.json({ place }, { status: 201 })
  } catch (error) {
    console.error('Create place error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
