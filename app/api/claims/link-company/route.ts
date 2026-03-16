import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { getInsuranceCase } from '@/lib/insurance-store'

export const dynamic = 'force-dynamic'

// NOTE: Before using this endpoint the following migration must be applied:
//
//   ALTER TABLE insurance_cases
//     ADD COLUMN accounting_company_id uuid
//     REFERENCES companies(id) ON DELETE SET NULL;
//
// This column creates an explicit cross-module link between a claims case and the
// accounting module's company record (which may differ from the intake company_id).

// POST /api/claims/link-company
// Body: { case_id: string, company_id: string }
// Links an accounting company to an insurance case via accounting_company_id.
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { case_id, company_id } = body ?? {}

    if (!case_id || typeof case_id !== 'string') {
      return NextResponse.json({ error: 'case_id is required' }, { status: 400 })
    }
    if (!company_id || typeof company_id !== 'string') {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    // IDOR: verify the case exists and is accessible by this user
    const existing = await getInsuranceCase(case_id)
    if (!existing) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }
    if (userRole !== 'admin' && existing.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify the target company exists (prevents FK violation with a clear error)
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .is('deleted_at', null)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('insurance_cases')
      .update({ accounting_company_id: company_id, updated_at: new Date().toISOString() })
      .eq('id', case_id)

    if (error) throw new Error(`Failed to link company: ${error.message}`)

    return NextResponse.json({
      linked: true,
      case_id,
      accounting_company: { id: company.id, name: company.name },
    })
  } catch (error) {
    console.error('[Claims link-company] POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/claims/link-company?case_id=<uuid>
// Clears accounting_company_id on the given insurance case.
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const caseId = searchParams.get('case_id')
  if (!caseId) {
    return NextResponse.json({ error: 'case_id is required' }, { status: 400 })
  }

  try {
    // IDOR: verify access before mutating
    const existing = await getInsuranceCase(caseId)
    if (!existing) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }
    if (userRole !== 'admin' && existing.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('insurance_cases')
      .update({ accounting_company_id: null, updated_at: new Date().toISOString() })
      .eq('id', caseId)

    if (error) throw new Error(`Failed to unlink company: ${error.message}`)

    return NextResponse.json({ unlinked: true, case_id: caseId })
  } catch (error) {
    console.error('[Claims link-company] DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
