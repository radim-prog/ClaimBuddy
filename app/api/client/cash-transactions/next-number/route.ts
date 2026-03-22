import { NextRequest, NextResponse } from 'next/server'
import { canAccessCompany } from '@/lib/access-check'
import { generateCashDocNumber } from '@/lib/cash-numbering'
import type { CashDocType } from '@/lib/types/bank-matching'

export const dynamic = 'force-dynamic'

// GET /api/client/cash-transactions/next-number?company_id=X&doc_type=PPD&year=2026
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  const impersonate = request.headers.get('x-impersonate-company')
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const docType = (searchParams.get('doc_type') || 'PPD') as CashDocType
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

  if (!companyId) return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })
  if (!['PPD', 'VPD'].includes(docType)) {
    return NextResponse.json({ error: 'Invalid doc_type (PPD or VPD)' }, { status: 400 })
  }

  const allowed = await canAccessCompany(userId, userRole, companyId, impersonate)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const docNumber = await generateCashDocNumber(companyId, docType, year)
    return NextResponse.json({ doc_number: docNumber, doc_type: docType, year })
  } catch (error) {
    console.error('[CashNextNumber] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
