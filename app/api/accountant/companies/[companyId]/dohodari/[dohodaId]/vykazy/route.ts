import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getVykazy, createVykaz, confirmVykaz, markVykazPaid } from '@/lib/dohodari-store-db'
import type { VykazStatus, PaymentStatus } from '@/lib/types/dohodari'

export const dynamic = 'force-dynamic'

// GET — list timesheets for an agreement
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string; dohodaId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const vykaz_status = searchParams.get('vykaz_status') as VykazStatus | null
    const payment_status = searchParams.get('payment_status') as PaymentStatus | null

    const vykazy = await getVykazy(params.dohodaId, {
      vykaz_status: vykaz_status || undefined,
      payment_status: payment_status || undefined,
    })

    return NextResponse.json({ vykazy })
  } catch (error) {
    console.error('Vykazy list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create/confirm/pay timesheet
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string; dohodaId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const action = body.action || 'create'

    if (action === 'confirm' && body.vykaz_id) {
      const vykaz = await confirmVykaz(body.vykaz_id, params.companyId)
      return NextResponse.json({ vykaz })
    }

    if (action === 'pay' && body.vykaz_id) {
      const vykaz = await markVykazPaid(body.vykaz_id, params.companyId, {
        payment_date: body.payment_date || new Date().toISOString().split('T')[0],
        payment_method: body.payment_method,
      })
      return NextResponse.json({ vykaz })
    }

    // Default: create new timesheet
    const { period, hodiny } = body
    if (!period || hodiny === undefined) {
      return NextResponse.json({ error: 'Missing required fields: period, hodiny' }, { status: 400 })
    }

    const vykaz = await createVykaz({
      dohoda_id: params.dohodaId,
      company_id: params.companyId,
      period,
      hodiny: Number(hodiny),
      prohlaseni: body.prohlaseni,
      student: body.student,
      disability_level: body.disability_level,
      children_count: body.children_count,
      notes: body.notes,
    })

    return NextResponse.json({ vykaz }, { status: 201 })
  } catch (error) {
    console.error('Vykazy create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
