import { NextRequest, NextResponse } from 'next/server'
import { getClosures, updateClosureFull } from '@/lib/closure-store-db'
import { addActivity } from '@/lib/activity-store-db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId') || undefined
    const period = searchParams.get('period') || undefined

    const closures = await getClosures({
      companyId,
      period,
    })

    return NextResponse.json({ closures })
  } catch (error) {
    console.error('Closures fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { closure_id, bank_statement_status, expense_documents_status, income_invoices_status, notes, company_name, period } = body

    if (!closure_id) {
      return NextResponse.json({ error: 'closure_id is required' }, { status: 400 })
    }

    const userName = request.headers.get('x-user-name') || 'Účetní'

    const updated = await updateClosureFull(closure_id, {
      bank_statement_status,
      expense_documents_status,
      income_invoices_status,
      notes,
      updated_by: userName,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Closure not found' }, { status: 404 })
    }

    // Record activity
    await addActivity({
      type: 'closure_status_changed',
      company_id: updated.company_id,
      company_name: company_name || '',
      title: `Uzávěrka ${period || updated.period} aktualizována`,
      description: `Výpisy: ${updated.bank_statement_status}, Náklady: ${updated.expense_documents_status}, Příjmy: ${updated.income_invoices_status}`,
      created_by: userName,
    })

    return NextResponse.json({ closure: updated })
  } catch (error) {
    console.error('Closure update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
