import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function isStaff(request: NextRequest): boolean {
  const role = request.headers.get('x-user-role')
  return ['admin', 'accountant', 'assistant'].includes(role || '')
}

async function canAccessCompany(request: NextRequest, companyId: string): Promise<boolean> {
  if (isStaff(request)) return true
  if (request.headers.get('x-impersonate-company') === companyId) return true
  const userId = request.headers.get('x-user-id')!
  const { data } = await supabaseAdmin.from('companies').select('id').eq('id', companyId).eq('owner_id', userId).single()
  return !!data
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = request.nextUrl.searchParams.get('company_id')
  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 })

  try {
    if (!(await canAccessCompany(request, companyId))) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get all non-deleted invoices for this company
    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select('total_with_vat, total_without_vat, type, payment_status, paid_at, sent_at, issue_date, due_date, document_type')
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)

    const rows = invoices || []

    // Monthly income/expense for all 12 months of current year
    const now = new Date()
    const monthly: Array<{ month: string; income: number; expense: number }> = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthRows = rows.filter(r => r.issue_date?.startsWith(key))
      const income = monthRows
        .filter(r => r.type === 'income' && (r.document_type || 'invoice') !== 'credit_note')
        .reduce((s, r) => s + (Number(r.total_with_vat) || 0), 0)
      const expense = monthRows
        .filter(r => r.type === 'expense' || (r.document_type || 'invoice') === 'credit_note')
        .reduce((s, r) => s + Math.abs(Number(r.total_with_vat) || 0), 0)
      monthly.push({ month: key, income: Math.round(income), expense: Math.round(expense) })
    }

    // Status distribution
    const statusCounts = { paid: 0, sent: 0, draft: 0, overdue: 0 }
    for (const r of rows) {
      if (r.paid_at || r.payment_status === 'paid') {
        statusCounts.paid++
      } else if (r.sent_at) {
        if (r.due_date && new Date(r.due_date) < now) {
          statusCounts.overdue++
        } else {
          statusCounts.sent++
        }
      } else {
        if (r.due_date && new Date(r.due_date) < now) {
          statusCounts.overdue++
        } else {
          statusCounts.draft++
        }
      }
    }

    return NextResponse.json({ monthly, statusCounts })
  } catch (error) {
    console.error('Invoice stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
