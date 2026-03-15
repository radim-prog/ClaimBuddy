import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getVykazy, createVykaz } from '@/lib/dohodari-store-db'

export const dynamic = 'force-dynamic'

async function getCompanyIds(userId: string, impersonateCompany: string | null): Promise<string[]> {
  if (impersonateCompany) return [impersonateCompany]
  const { data } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('owner_id', userId)
    .is('deleted_at', null)
  return (data ?? []).map((c: any) => c.id)
}

// GET — list timesheets for a specific agreement
export async function GET(
  request: NextRequest,
  { params }: { params: { dohodaId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const vykazy = await getVykazy(params.dohodaId, {})
    return NextResponse.json({ vykazy })
  } catch (error) {
    console.error('Client vykazy list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — client submits hours worked for a period
export async function POST(
  request: NextRequest,
  { params }: { params: { dohodaId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getCompanyIds(userId, request.headers.get('x-impersonate-company'))
    if (companyIds.length === 0) return NextResponse.json({ error: 'No company' }, { status: 404 })

    const body = await request.json()
    const { period, hodiny } = body

    if (!period || hodiny === undefined) {
      return NextResponse.json({ error: 'Missing required fields: period, hodiny' }, { status: 400 })
    }

    const vykaz = await createVykaz({
      dohoda_id: params.dohodaId,
      company_id: companyIds[0],
      period,
      hodiny: Number(hodiny),
      notes: body.notes,
    })

    return NextResponse.json({ vykaz }, { status: 201 })
  } catch (error) {
    console.error('Client vykaz create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
