import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  const period = searchParams.get('period')

  if (!companyId || !period) {
    return NextResponse.json({ error: 'companyId and period required' }, { status: 400 })
  }

  try {
    const [bankAccountsRes, documentsRes, invoicesRes, companyRes] = await Promise.all([
      supabaseAdmin
        .from('bank_accounts')
        .select('id, account_number, bank_code, bank_name, label, is_primary')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false }),

      supabaseAdmin
        .from('documents')
        .select('id, type, file_name, metadata')
        .eq('company_id', companyId)
        .eq('period', period)
        .is('deleted_at', null),

      supabaseAdmin
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('period', period)
        .eq('type', 'invoice')
        .is('deleted_at', null),

      supabaseAdmin
        .from('companies')
        .select('income_invoice_source')
        .eq('id', companyId)
        .single(),
    ])

    const bankAccounts = bankAccountsRes.data || []
    const documents = documentsRes.data || []

    // --- Bank statements ---
    const bankStatementDocs = documents.filter((d: any) => d.type === 'bank_statement')

    const accountsWithStatus = bankAccounts.map((acc: any) => {
      const accountLabel = acc.label || `${acc.bank_name || ''} ${acc.account_number}`.trim()
      const hasStatement = bankStatementDocs.some((doc: any) => {
        const fn = (doc.file_name || '').toLowerCase()
        const accNum = (acc.account_number || '').replace(/[^0-9]/g, '')
        return (accNum.length >= 4 && fn.includes(accNum)) ||
          (doc.metadata as any)?.bank_account_id === acc.id
      })
      return {
        id: acc.id,
        label: accountLabel,
        bank_code: acc.bank_code,
        account_number: acc.account_number,
        is_primary: acc.is_primary,
        has_statement: hasStatement,
      }
    })

    // --- Expense documents ---
    const expenseDocs = documents.filter((d: any) =>
      d.type === 'expense_invoice' || d.type === 'receipt'
    )

    // --- Income invoices ---
    const incomeDocs = documents.filter((d: any) => d.type === 'income_invoice')
    const systemInvoicesCount = invoicesRes.count || 0
    const incomeSource = companyRes.data?.income_invoice_source || 'unknown'

    return NextResponse.json({
      bank_statements: {
        expected: bankAccounts.length,
        uploaded: bankStatementDocs.length,
        matched: accountsWithStatus.filter((a: any) => a.has_statement).length,
        accounts: accountsWithStatus,
      },
      expense_documents: {
        uploaded_count: expenseDocs.length,
      },
      income_invoices: {
        uploaded_count: incomeDocs.length,
        system_invoices_count: systemInvoicesCount,
        uses_internal_invoicing: incomeSource === 'internal',
        income_source: incomeSource,
      },
    })
  } catch (error) {
    console.error('[DocumentCheck] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
