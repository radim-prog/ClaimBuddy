import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getInsuranceCases, createInsuranceCase } from '@/lib/insurance-store'
import { createCaseSchema, formatZodErrors } from '@/lib/validations'

export const dynamic = 'force-dynamic'

// GET /api/claims/cases — list with filters
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const companyId = searchParams.get('company_id') || undefined
  const insuranceCompanyId = searchParams.get('insurance_company_id') || undefined
  const search = searchParams.get('search') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

  try {
    const { data, count } = await getInsuranceCases({
      assignedTo: userRole === 'admin' ? undefined : userId,
      companyId,
      status,
      insuranceCompanyId,
      search,
      page,
      limit,
    })

    return NextResponse.json({ cases: data, total: count, page, limit })
  } catch (error) {
    console.error('[Claims cases] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/claims/cases — create new case
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = createCaseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 })
    }

    const input = parsed.data
    const created = await createInsuranceCase(
      {
        company_id: input.company_id ?? undefined,
        assigned_to: input.assigned_to ?? userId,
        policy_number: input.policy_number ?? undefined,
        claim_number: input.claim_number ?? undefined,
        insurance_company_id: input.insurance_company_id ?? undefined,
        insurance_type: input.insurance_type,
        event_date: input.event_date ?? undefined,
        event_description: input.event_description ?? undefined,
        event_location: input.event_location ?? undefined,
        claimed_amount: input.claimed_amount ?? undefined,
        priority: input.priority ?? undefined,
        deadline: input.deadline ?? undefined,
        note: input.note ?? undefined,
        tags: input.tags,
      },
      userId
    )

    return NextResponse.json({ case: created }, { status: 201 })
  } catch (error) {
    console.error('[Claims cases] POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
