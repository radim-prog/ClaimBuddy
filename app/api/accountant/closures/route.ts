import { NextResponse } from 'next/server'
import { updateClosureFull } from '@/lib/closure-store-db'
import { addActivity } from '@/lib/activity-store-db'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request) {
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
