import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { NON_TAXABLE_CATEGORIES } from '@/lib/types/bank-matching'

export const dynamic = 'force-dynamic'

// GET /api/accountant/closures/matrix?year=2026
// Returns all companies × 12 months with completion %, status colors
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    // Fetch all active companies
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('active', true)
      .order('name')

    if (!companies || companies.length === 0) {
      return NextResponse.json({ year: parseInt(year), companies: [] })
    }

    const companyIds = companies.map(c => c.id)

    // Fetch all closures for the year
    const { data: closures } = await supabaseAdmin
      .from('monthly_closures')
      .select('company_id, period, status, bank_statement_status, expense_invoices_status, income_invoices_status, cash_documents_status')
      .in('company_id', companyIds)
      .gte('period', `${year}-01`)
      .lte('period', `${year}-12`)

    // Fetch transaction counts per company×period for progress calc
    // Try server-side aggregation via RPC, fallback to raw fetch with high limit
    let txAggRaw: any[] | null = null
    try {
      const { data } = await supabaseAdmin.rpc('aggregate_tx_matrix', {
        p_company_ids: companyIds,
        p_year: year,
      })
      txAggRaw = data
    } catch { /* RPC may not exist, use fallback */ }

    // Fallback: if RPC not available, fetch rows with high limit
    let transactions: any[] | null = null
    if (!txAggRaw) {
      const { data } = await supabaseAdmin
        .from('bank_transactions')
        .select('company_id, period, matched_document_id, matched_invoice_id, matched_dohoda_mesic_id, category')
        .in('company_id', companyIds)
        .gte('period', `${year}-01`)
        .lte('period', `${year}-12`)
        .limit(200000)
      transactions = data
    }

    // Index closures by company_id+period
    const closureMap = new Map<string, any>()
    for (const c of closures || []) {
      closureMap.set(`${c.company_id}:${c.period}`, c)
    }

    // Index transactions by company_id+period
    const txMap = new Map<string, { total: number; matched: number; private: number }>()

    if (txAggRaw && Array.isArray(txAggRaw)) {
      // Use pre-aggregated data from RPC
      for (const row of txAggRaw) {
        txMap.set(`${row.company_id}:${row.period}`, {
          total: Number(row.total) || 0,
          matched: Number(row.matched) || 0,
          private: Number(row.private_count) || 0,
        })
      }
    } else if (transactions) {
      for (const tx of transactions) {
        const key = `${tx.company_id}:${tx.period}`
        if (!txMap.has(key)) txMap.set(key, { total: 0, matched: 0, private: 0 })
        const entry = txMap.get(key)!
        entry.total++
        const isMatched = !!(tx.matched_document_id || tx.matched_invoice_id || tx.matched_dohoda_mesic_id)
        const isPrivate = NON_TAXABLE_CATEGORIES.includes(tx.category as any)
        if (isMatched) entry.matched++
        else if (isPrivate) entry.private++
      }
    }

    // Build matrix
    const matrix = companies.map(company => {
      const months: Record<string, any> = {}

      for (let m = 1; m <= 12; m++) {
        const period = `${year}-${String(m).padStart(2, '0')}`
        const closure = closureMap.get(`${company.id}:${period}`)
        const txData = txMap.get(`${company.id}:${period}`)

        const totalActionable = txData ? txData.total - txData.private : 0
        const progress = totalActionable > 0
          ? Math.round((txData!.matched / totalActionable) * 100)
          : (txData && txData.total > 0 ? 100 : 0)

        // Color logic: green=approved, yellow=in_progress, red=open+has_data, gray=no_data
        let color: 'green' | 'yellow' | 'red' | 'gray' = 'gray'
        if (closure) {
          if (closure.status === 'approved' || closure.status === 'closed') color = 'green'
          else if (progress >= 100) color = 'yellow'
          else if (txData && txData.total > 0) color = 'red'
        } else if (txData && txData.total > 0) {
          color = 'red'
        }

        months[period] = {
          status: closure?.status || (txData && txData.total > 0 ? 'open' : null),
          progress,
          color,
          bank_statement: closure?.bank_statement_status || 'missing',
          expenses: closure?.expense_invoices_status || 'missing',
          income: closure?.income_invoices_status || 'missing',
          cash: closure?.cash_documents_status || 'not_applicable',
          transaction_count: txData?.total || 0,
        }
      }

      return {
        company_id: company.id,
        company_name: company.name,
        months,
      }
    })

    return NextResponse.json({
      year: parseInt(year),
      companies: matrix,
      total_companies: companies.length,
    })
  } catch (error) {
    console.error('[ClosureMatrix] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
