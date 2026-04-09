import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserCompanyIds } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET — list insurance cases for the client's company
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const impersonateCompany = request.headers.get('x-impersonate-company')
    const companyIds = impersonateCompany ? [impersonateCompany] : await getUserCompanyIds(userId)

    if (companyIds.length === 0) {
      return NextResponse.json({ cases: [] })
    }

    const { data: cases, error } = await supabaseAdmin
      .from('insurance_cases')
      .select(`
        id, case_number, insurance_type, event_date, event_description, event_location,
        claimed_amount, approved_amount, paid_amount, status, priority, deadline, created_at,
        service_mode, payment_status, ai_report, ai_processed_at,
        insurance_company:insurance_companies(id, name)
      `)
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Client claims API error:', error)
      return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
    }

    return NextResponse.json({ cases: cases || [] })
  } catch (error) {
    console.error('Client claims API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
