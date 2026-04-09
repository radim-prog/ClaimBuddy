import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCaseEvents } from '@/lib/insurance-store'
import { canAccessCompany } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ caseId: string }> }

// GET /api/client/claims/[caseId]/timeline — client-visible timeline events
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { caseId } = await params

  try {
    const userRole = request.headers.get('x-user-role')
    const impersonateCompany = request.headers.get('x-impersonate-company')

    const { data: caseData } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, company_id')
      .eq('id', caseId)
      .single()

    if (!caseData?.company_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const hasAccess = await canAccessCompany(userId, userRole, caseData.company_id, impersonateCompany)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Only return client-visible events
    const events = await getCaseEvents(caseId, 'client')
    return NextResponse.json({ events })
  } catch (error) {
    console.error('[Client timeline] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
