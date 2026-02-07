import { NextResponse } from 'next/server'
import { updateClosureFull } from '@/lib/closure-store'
import { addActivity } from '@/lib/activity-store'
import { MOCK_CONFIG } from '@/lib/mock-data'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { closure_id, bank_statement_status, expense_documents_status, income_invoices_status, notes, company_name, period } = body

    if (!closure_id) {
      return NextResponse.json({ error: 'closure_id is required' }, { status: 400 })
    }

    const updated = updateClosureFull(closure_id, {
      bank_statement_status,
      expense_documents_status,
      income_invoices_status,
      notes,
      updated_by: MOCK_CONFIG.CURRENT_USER_NAME,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Closure not found' }, { status: 404 })
    }

    // Record activity
    addActivity({
      type: 'closure_status_changed',
      company_id: updated.company_id,
      company_name: company_name || '',
      title: `Uzávěrka ${period || updated.period} aktualizována`,
      description: `Výpisy: ${updated.bank_statement_status}, Náklady: ${updated.expense_documents_status}, Příjmy: ${updated.income_invoices_status}`,
      created_by: MOCK_CONFIG.CURRENT_USER_NAME,
    })

    return NextResponse.json({ closure: updated })
  } catch (error) {
    console.error('Closure update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
