import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCaseEvents } from '@/lib/insurance-store'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ caseId: string }> }

// GET /api/client/claims/[caseId]/timeline — client-visible timeline events
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { caseId } = await params

  try {
    // Resolve company_id from client_users
    const { data: clientUser } = await supabaseAdmin
      .from('client_users')
      .select('company_id')
      .eq('user_id', userId)
      .single()

    if (!clientUser?.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify case belongs to client's company
    const { data: caseData } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, company_id')
      .eq('id', caseId)
      .single()

    if (!caseData || caseData.company_id !== clientUser.company_id) {
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
