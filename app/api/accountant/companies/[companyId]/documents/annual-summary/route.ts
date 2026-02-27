import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = params
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

  try {
    // Fetch closures for this year
    const { data: closures, error: closuresError } = await supabaseAdmin
      .from('monthly_closures')
      .select('id, period, status, bank_statement_status, expense_invoices_status, income_invoices_status')
      .eq('company_id', companyId)
      .like('period', `${year}-%`)
      .order('period')

    if (closuresError) {
      return NextResponse.json({ error: closuresError.message }, { status: 500 })
    }

    // Fetch document counts grouped by period and type
    const { data: docs, error: docsError } = await supabaseAdmin
      .from('documents')
      .select('period, type, status')
      .eq('company_id', companyId)
      .like('period', `${year}-%`)
      .is('deleted_at', null)

    if (docsError) {
      return NextResponse.json({ error: docsError.message }, { status: 500 })
    }

    // Group document counts by period → type
    const docCounts: Record<string, Record<string, number>> = {}
    const docStatusCounts: Record<string, Record<string, number>> = {}
    for (const doc of docs ?? []) {
      if (!docCounts[doc.period]) docCounts[doc.period] = {}
      docCounts[doc.period][doc.type] = (docCounts[doc.period][doc.type] || 0) + 1

      if (!docStatusCounts[doc.period]) docStatusCounts[doc.period] = {}
      docStatusCounts[doc.period][doc.status] = (docStatusCounts[doc.period][doc.status] || 0) + 1
    }

    // Build closures map
    const closureMap: Record<string, any> = {}
    for (const c of closures ?? []) {
      closureMap[c.period] = c
    }

    // Build 12-month array
    let totalDocuments = 0
    let totalApproved = 0
    let missingMonths = 0

    const months = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0')
      const period = `${year}-${month}`
      const closure = closureMap[period]
      const counts = docCounts[period] || {}
      const statusCounts = docStatusCounts[period] || {}

      const bankCount = counts['bank_statement'] || 0
      const expenseCount = (counts['expense_invoice'] || 0) + (counts['receipt'] || 0)
      const incomeCount = counts['income_invoice'] || 0
      const total = Object.values(counts).reduce((s, n) => s + n, 0)
      const approved = statusCounts['approved'] || 0

      totalDocuments += total
      totalApproved += approved

      const bankStatus = closure?.bank_statement_status || 'missing'
      const expenseStatus = closure?.expense_invoices_status || 'missing'
      const incomeStatus = closure?.income_invoices_status || 'missing'

      const isMissing = [bankStatus, expenseStatus, incomeStatus].some(s => s === 'missing')
      if (isMissing) missingMonths++

      return {
        period,
        closure_id: closure?.id || null,
        closure_status: closure?.status || null,
        bank_statement: {
          status: bankStatus,
          count: bankCount,
        },
        expense_documents: {
          status: expenseStatus,
          count: expenseCount,
        },
        income_invoices: {
          status: incomeStatus,
          count: incomeCount,
        },
        receipts: { count: counts['receipt'] || 0 },
        total_documents: total,
        approved_documents: approved,
      }
    })

    return NextResponse.json({
      year,
      months,
      totals: {
        total_documents: totalDocuments,
        approved: totalApproved,
        missing_months: missingMonths,
      },
    })
  } catch (err) {
    console.error('Annual summary API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
