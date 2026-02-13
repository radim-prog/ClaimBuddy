import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDemoCompanyIds } from '@/lib/company-store'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getDemoCompanyIds()

    if (companyIds.length === 0) {
      return NextResponse.json({ invoices: [], count: 0 })
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .in('company_id', companyIds)
      .order('issue_date', { ascending: false })
      .limit(100)

    if (error) throw new Error(error.message)

    const invoices = (data ?? []).map(i => ({
      id: i.id,
      company_id: i.company_id,
      invoice_number: i.invoice_number,
      type: i.type,
      partner_name: i.partner_name,
      amount: i.amount,
      currency: i.currency || 'CZK',
      issue_date: i.issue_date,
      due_date: i.due_date,
      status: i.status,
    }))

    return NextResponse.json({ invoices, count: invoices.length })
  } catch (error) {
    console.error('Client invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
