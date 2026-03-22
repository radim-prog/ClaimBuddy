import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'
import { NON_TAXABLE_CATEGORIES } from '@/lib/types/bank-matching'

export const dynamic = 'force-dynamic'

// GET /api/client/closures/transactions?company_id=X&period=2026-01
// Returns transactions grouped by confidence tier:
//   auto (≥0.80), suggestions (0.40-0.79), unmatched, private
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const period = searchParams.get('period')
    const tier = searchParams.get('tier') // optional: filter to specific tier

    if (!companyId || !period) {
      return NextResponse.json({ error: 'Missing company_id or period' }, { status: 400 })
    }

    const userRole = request.headers.get('x-user-role')
    const impersonate = request.headers.get('x-impersonate-company')
    if (!(await canAccessCompany(userId, userRole, companyId, impersonate))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: transactions, error } = await supabaseAdmin
      .from('bank_transactions')
      .select('*')
      .eq('company_id', companyId)
      .eq('period', period)
      .order('transaction_date', { ascending: false })
      .limit(1000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const txs = transactions || []

    // Group into tiers
    const auto: typeof txs = []
    const suggestions: typeof txs = []
    const unmatched: typeof txs = []
    const privateTransfers: typeof txs = []

    for (const tx of txs) {
      const isMatched = !!(tx.matched_document_id || tx.matched_invoice_id || tx.matched_dohoda_mesic_id)
      const isPrivate = NON_TAXABLE_CATEGORIES.includes(tx.category as any)
      const confidence = Number(tx.match_confidence) || 0

      if (isPrivate && !isMatched) {
        privateTransfers.push(tx)
      } else if (isMatched && (confidence >= 0.80 || tx.match_method === 'manual')) {
        auto.push(tx)
      } else if (isMatched && confidence >= 0.40) {
        suggestions.push(tx)
      } else {
        unmatched.push(tx)
      }
    }

    // If specific tier requested, return only that
    if (tier) {
      const tierMap: Record<string, typeof txs> = {
        auto, suggestions, unmatched, private: privateTransfers,
      }
      const selected = tierMap[tier]
      if (!selected) {
        return NextResponse.json({ error: 'Invalid tier. Use: auto, suggestions, unmatched, private' }, { status: 400 })
      }
      return NextResponse.json({ tier, transactions: selected, count: selected.length })
    }

    return NextResponse.json({
      period,
      total: txs.length,
      tiers: {
        auto: { transactions: auto, count: auto.length },
        suggestions: { transactions: suggestions, count: suggestions.length },
        unmatched: { transactions: unmatched, count: unmatched.length },
        private: { transactions: privateTransfers, count: privateTransfers.length },
      },
    })
  } catch (error) {
    console.error('[ClosureTransactions] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
