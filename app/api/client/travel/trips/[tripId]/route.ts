import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTrip, updateTrip, deleteTrip } from '@/lib/travel-store-db'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getCompanyIds(userId, request.headers.get('x-impersonate-company'))
    if (companyIds.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const trip = await getTrip(params.tripId, companyIds[0])
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

    return NextResponse.json({ trip })
  } catch (error) {
    console.error('Get trip error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getCompanyIds(userId, request.headers.get('x-impersonate-company'))
    if (companyIds.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const trip = await updateTrip(params.tripId, companyIds[0], body)
    return NextResponse.json({ trip })
  } catch (error) {
    console.error('Update trip error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getCompanyIds(userId, request.headers.get('x-impersonate-company'))
    if (companyIds.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await deleteTrip(params.tripId, companyIds[0])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete trip error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
