import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'
import { validateCashTransaction, getDailyPartnerTotal } from '@/lib/cash-validation'
import { generateCashDocNumber } from '@/lib/cash-numbering'

export const dynamic = 'force-dynamic'

// GET /api/client/cash-transactions?company_id=X&period=2026-01
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const period = searchParams.get('period')
  const impersonate = request.headers.get('x-impersonate-company')

  if (!companyId) return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })

  const allowed = await canAccessCompany(userId, userRole, companyId, impersonate)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    let query = supabaseAdmin
      .from('cash_transactions')
      .select('*')
      .eq('company_id', companyId)
      .order('transaction_date', { ascending: false })
      .order('doc_number', { ascending: false })

    if (period) {
      query = query.eq('period', period)
    }

    const { data, error } = await query.limit(500)
    if (error) throw error

    return NextResponse.json({ transactions: data || [], count: data?.length || 0 })
  } catch (error) {
    console.error('[CashTransactions GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/client/cash-transactions — create new PPD/VPD
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  const impersonate = request.headers.get('x-impersonate-company')

  try {
    const body = await request.json()
    const {
      company_id, doc_type, transaction_date, amount, description,
      counterparty_name, category, period,
    } = body

    if (!company_id || !doc_type || !transaction_date || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const allowed = await canAccessCompany(userId, userRole, company_id, impersonate)
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Validate
    let dailyTotal = 0
    if (counterparty_name) {
      dailyTotal = await getDailyPartnerTotal(supabaseAdmin, company_id, counterparty_name, transaction_date)
    }

    // Fetch current register balance (sum of all transactions for this company)
    let registerBalance: number | undefined
    if (doc_type === 'VPD') {
      const { data: balRow } = await supabaseAdmin
        .from('cash_transactions')
        .select('amount')
        .eq('company_id', company_id)
      registerBalance = (balRow || []).reduce((sum: number, r: { amount: number }) => sum + r.amount, 0)
    }

    const errors = validateCashTransaction(
      { doc_type, transaction_date, amount: Math.abs(amount), counterparty_name },
      { dailyTotalForPartner: dailyTotal, registerBalance }
    )
    const hardErrors = errors.filter(e => e.severity === 'error')
    if (hardErrors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: hardErrors }, { status: 422 })
    }

    // Auto-generate doc_number
    const year = new Date(transaction_date).getFullYear()
    const docNumber = await generateCashDocNumber(company_id, doc_type, year)

    // Derive period from date if not provided
    const derivedPeriod = period || transaction_date.substring(0, 7)

    // Amount sign convention: PPD = positive (income), VPD = negative (expense)
    const signedAmount = doc_type === 'PPD' ? Math.abs(amount) : -Math.abs(amount)

    const { data, error } = await supabaseAdmin
      .from('cash_transactions')
      .insert({
        company_id,
        doc_type,
        doc_number: docNumber,
        transaction_date,
        amount: signedAmount,
        description: description || null,
        counterparty_name: counterparty_name || null,
        category: category || 'uncategorized',
        period: derivedPeriod,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      transaction: data,
      warnings: errors.filter(e => e.severity === 'warning'),
    }, { status: 201 })
  } catch (error) {
    console.error('[CashTransactions POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
