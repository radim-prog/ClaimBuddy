import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getDohodaById, updateDohoda, deleteDohoda } from '@/lib/dohodari-store-db'

export const dynamic = 'force-dynamic'

// GET — single agreement detail
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string; dohodaId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const dohoda = await getDohodaById(params.dohodaId, params.companyId)
    if (!dohoda) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ dohoda })
  } catch (error) {
    console.error('Dohodari detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update agreement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string; dohodaId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()

    // Whitelist allowed fields
    const ALLOWED_FIELDS = [
      'typ', 'popis_prace', 'misto_vykonu', 'sazba', 'max_hodin_rok',
      'platnost_od', 'platnost_do', 'prohlaseni_podepsano', 'prohlaseni_datum',
      'podpis_zamestnavatel', 'podpis_zamestnanec', 'podpis_datum',
      'status', 'notes',
    ]
    const updates: Record<string, any> = {}
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const dohoda = await updateDohoda(params.dohodaId, params.companyId, updates)
    return NextResponse.json({ dohoda })
  } catch (error) {
    console.error('Dohodari update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — soft-delete (terminate) agreement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { companyId: string; dohodaId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    await deleteDohoda(params.dohodaId, params.companyId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dohodari delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
