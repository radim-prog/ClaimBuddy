import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getInsuranceCase, getCasePayments, addCasePayment } from '@/lib/insurance-store'
import { addCasePaymentSchema, formatZodErrors } from '@/lib/validations'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ caseId: string }> }

// GET /api/claims/cases/[caseId]/payments
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId } = await params

  try {
    // IDOR check
    const caseData = await getInsuranceCase(caseId)
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (userRole !== 'admin' && caseData.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payments = await getCasePayments(caseId)
    return NextResponse.json({ payments })
  } catch (error) {
    console.error('[Claims payments] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/claims/cases/[caseId]/payments — record payment
export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId } = await params

  try {
    // IDOR check
    const caseData = await getInsuranceCase(caseId)
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (userRole !== 'admin' && caseData.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = addCasePaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 })
    }

    const payment = await addCasePayment({
      case_id: caseId,
      amount: parsed.data.amount,
      payment_type: parsed.data.payment_type,
      payment_date: parsed.data.payment_date,
      reference: parsed.data.reference ?? undefined,
      note: parsed.data.note ?? undefined,
      created_by: userId,
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error('[Claims payments] POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
