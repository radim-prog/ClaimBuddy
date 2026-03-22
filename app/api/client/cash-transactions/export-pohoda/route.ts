import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCompany } from '@/lib/access-check'
import { generateVoucherXml, type CashVoucherForExport } from '@/lib/pohoda-xml'

export const dynamic = 'force-dynamic'

// GET /api/client/cash-transactions/export-pohoda?company_id=X&period=2026-01
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  const impersonate = request.headers.get('x-impersonate-company')
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const period = searchParams.get('period')

  if (!companyId || !period) {
    return NextResponse.json({ error: 'Missing company_id or period' }, { status: 400 })
  }

  const allowed = await canAccessCompany(userId, userRole, companyId, impersonate)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Get company ICO
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('ico')
      .eq('id', companyId)
      .single()

    const ico = company?.ico || ''

    // Get cash transactions for period
    const { data: cashTxs } = await supabaseAdmin
      .from('cash_transactions')
      .select('id, doc_type, doc_number, transaction_date, amount, description, counterparty_name')
      .eq('company_id', companyId)
      .eq('period', period)
      .order('doc_number')

    if (!cashTxs || cashTxs.length === 0) {
      return NextResponse.json({ error: 'No cash transactions to export' }, { status: 404 })
    }

    const vouchers: CashVoucherForExport[] = cashTxs.map(tx => ({
      id: tx.id,
      doc_type: tx.doc_type as 'PPD' | 'VPD',
      doc_number: tx.doc_number,
      transaction_date: tx.transaction_date,
      amount: Math.abs(tx.amount),
      description: tx.description,
      counterparty_name: tx.counterparty_name,
      counterparty_ico: null,
      vat_rate: 21,
    }))

    const xml = generateVoucherXml(vouchers, ico)

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="pohoda-cash-${companyId}-${period}.xml"`,
      },
    })
  } catch (error) {
    console.error('[CashExportPohoda] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
