import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDohodaById, updateDohoda } from '@/lib/dohodari-store-db'

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

// GET — single agreement detail
export async function GET(
  request: NextRequest,
  { params }: { params: { dohodaId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getCompanyIds(userId, request.headers.get('x-impersonate-company'))
    if (companyIds.length === 0) return NextResponse.json({ error: 'No company' }, { status: 404 })

    const dohoda = await getDohodaById(params.dohodaId, companyIds[0])
    if (!dohoda) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ dohoda })
  } catch (error) {
    console.error('Client dohodari detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — client can only update limited fields (sign, notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { dohodaId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getCompanyIds(userId, request.headers.get('x-impersonate-company'))
    if (companyIds.length === 0) return NextResponse.json({ error: 'No company' }, { status: 404 })

    const body = await request.json()

    // Client can only update: sign, prohlaseni
    const ALLOWED_FIELDS = ['podpis_zamestnanec', 'podpis_datum', 'prohlaseni_podepsano', 'prohlaseni_datum', 'notes']
    const updates: Record<string, any> = {}
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const dohoda = await updateDohoda(params.dohodaId, companyIds[0], updates)
    return NextResponse.json({ dohoda })
  } catch (error) {
    console.error('Client dohodari update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
