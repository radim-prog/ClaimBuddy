import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getDohody, createDohoda } from '@/lib/dohodari-store-db'
import type { DohodaStatus } from '@/lib/types/dohodari'

export const dynamic = 'force-dynamic'

// GET — list all agreements for a company
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as DohodaStatus | null
    const typ = searchParams.get('typ') as 'dpp' | 'dpc' | null
    const employee_id = searchParams.get('employee_id') || undefined

    const dohody = await getDohody(params.companyId, {
      status: status || undefined,
      typ: typ || undefined,
      employee_id,
    })

    return NextResponse.json({ dohody })
  } catch (error) {
    console.error('Dohodari list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create new agreement
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { employee_id, typ, sazba, platnost_od } = body

    if (!employee_id || !typ || !sazba || !platnost_od) {
      return NextResponse.json({ error: 'Missing required fields: employee_id, typ, sazba, platnost_od' }, { status: 400 })
    }

    if (!['dpp', 'dpc'].includes(typ)) {
      return NextResponse.json({ error: 'typ must be dpp or dpc' }, { status: 400 })
    }

    const dohoda = await createDohoda({
      company_id: params.companyId,
      employee_id,
      typ,
      popis_prace: body.popis_prace,
      misto_vykonu: body.misto_vykonu,
      sazba: Number(sazba),
      max_hodin_rok: body.max_hodin_rok,
      platnost_od,
      platnost_do: body.platnost_do || null,
      prohlaseni_podepsano: body.prohlaseni_podepsano,
      prohlaseni_datum: body.prohlaseni_datum,
      status: body.status,
      notes: body.notes,
    })

    return NextResponse.json({ dohoda }, { status: 201 })
  } catch (error) {
    console.error('Dohodari create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
