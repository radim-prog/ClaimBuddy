import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const period = searchParams.get('period') || defaultPeriod

  try {
    // Fetch all active companies
    const { data: companies, error: compError } = await supabaseAdmin
      .from('companies')
      .select('id, name, ico')
      .is('deleted_at', null)
      .order('name')

    if (compError) {
      return NextResponse.json({ error: compError.message }, { status: 500 })
    }

    // Fetch closures for this period
    const { data: closures, error: closError } = await supabaseAdmin
      .from('monthly_closures')
      .select('company_id, status, bank_statement_status, expense_invoices_status, income_invoices_status')
      .eq('period', period)

    if (closError) {
      return NextResponse.json({ error: closError.message }, { status: 500 })
    }

    // Fetch document counts per company for this period
    const { data: docs, error: docsError } = await supabaseAdmin
      .from('documents')
      .select('company_id, type')
      .eq('period', period)
      .is('deleted_at', null)

    if (docsError) {
      return NextResponse.json({ error: docsError.message }, { status: 500 })
    }

    // Index closures and doc counts
    const closureMap: Record<string, any> = {}
    for (const c of closures ?? []) {
      closureMap[c.company_id] = c
    }

    const docCountMap: Record<string, number> = {}
    for (const d of docs ?? []) {
      docCountMap[d.company_id] = (docCountMap[d.company_id] || 0) + 1
    }

    // Build result
    let complete = 0
    let incomplete = 0
    let notStarted = 0

    const result = (companies ?? []).map(company => {
      const closure = closureMap[company.id]
      const bankStatus = closure?.bank_statement_status || 'missing'
      const expenseStatus = closure?.expense_invoices_status || 'missing'
      const incomeStatus = closure?.income_invoices_status || 'missing'
      const docCount = docCountMap[company.id] || 0

      const missingTypes: string[] = []
      if (bankStatus === 'missing') missingTypes.push('bank_statement')
      if (expenseStatus === 'missing') missingTypes.push('expense_documents')
      if (incomeStatus === 'missing') missingTypes.push('income_invoices')

      const allApproved = bankStatus === 'approved' && expenseStatus === 'approved' && incomeStatus === 'approved'
      const allMissing = bankStatus === 'missing' && expenseStatus === 'missing' && incomeStatus === 'missing'

      if (allApproved) complete++
      else if (allMissing && docCount === 0) notStarted++
      else incomplete++

      return {
        company_id: company.id,
        company_name: company.name,
        ico: company.ico,
        bank_statement_status: bankStatus,
        expense_documents_status: expenseStatus,
        income_invoices_status: incomeStatus,
        document_count: docCount,
        missing_types: missingTypes,
        closure_status: closure?.status || null,
      }
    })

    // Sort: incomplete first, then not started, then complete
    result.sort((a, b) => {
      const priority = (item: typeof a) => {
        if (item.missing_types.length > 0 && item.document_count > 0) return 0 // incomplete
        if (item.missing_types.length === 3 && item.document_count === 0) return 1 // not started
        return 2 // complete
      }
      return priority(a) - priority(b)
    })

    return NextResponse.json({
      period,
      companies: result,
      summary: { complete, incomplete, not_started: notStarted, total: result.length },
    })
  } catch (err) {
    console.error('Documents overview API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
