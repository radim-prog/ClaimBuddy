import { NextResponse } from 'next/server'
import { getAllVatReturns, getVatReturnsByCompany, getVatReturnsByPeriod, updateVatReturn } from '@/lib/vat-store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const period = searchParams.get('period')

    let returns
    if (companyId) {
      returns = await getVatReturnsByCompany(companyId)
    } else if (period) {
      returns = await getVatReturnsByPeriod(period)
    } else {
      returns = await getAllVatReturns()
    }

    return NextResponse.json({
      vat_returns: returns,
      count: returns.length,
    })
  } catch (error) {
    console.error('VAT returns API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, status, filed_date, amount, paid_date, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updated = await updateVatReturn(id, { status, filed_date, amount, paid_date, notes })

    if (!updated) {
      return NextResponse.json({ error: 'VAT return not found' }, { status: 404 })
    }

    return NextResponse.json({ vat_return: updated })
  } catch (error) {
    console.error('VAT return update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
