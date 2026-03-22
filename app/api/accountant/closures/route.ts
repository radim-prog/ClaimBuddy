import { NextRequest, NextResponse } from 'next/server'
import { getClosures, updateClosureFull, upsertClosureField } from '@/lib/closure-store-db'
import type { StatusField, StatusValue } from '@/lib/closure-store-db'
import { addActivity } from '@/lib/activity-store-db'
import { isStaffRole } from '@/lib/access-check'
import { triggerMissingDocsReminder } from '@/lib/missing-docs-reminder'
import { getUserName } from '@/lib/request-utils'

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

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { closure_id, bank_statement_status, expense_documents_status, income_invoices_status, notes, company_name, period } = body

    if (!closure_id) {
      return NextResponse.json({ error: 'closure_id is required' }, { status: 400 })
    }

    const userName = getUserName(request)

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

    // Trigger missing docs reminder check
    if (updated.period) {
      triggerMissingDocsReminder(updated.company_id, updated.period, userId).catch(err => {
        console.error('[Closures] Reminder trigger error:', err)
      })
    }

    return NextResponse.json({ closure: updated })
  } catch (error) {
    console.error('Closure update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id, period, field, value } = body

    if (!company_id || !period || !field || !value) {
      return NextResponse.json({ error: 'company_id, period, field, value required' }, { status: 400 })
    }

    const validFields: StatusField[] = ['bank_statement_status', 'expense_documents_status', 'income_invoices_status']
    const validValues: StatusValue[] = ['missing', 'uploaded', 'approved', 'reviewed', 'skipped']

    if (!validFields.includes(field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }
    if (!validValues.includes(value)) {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 })
    }

    const closure = await upsertClosureField(company_id, period, field, value, userId)

    // Trigger missing docs reminder check after closure update
    triggerMissingDocsReminder(company_id, period, userId).catch(err => {
      console.error('[Closures] Reminder trigger error:', err)
    })

    return NextResponse.json({ closure })
  } catch (error) {
    console.error('Closure PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — bulk review/close closures (accountant only)
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { action, closures } = body

    if (action !== 'bulk_review' && action !== 'bulk_close') {
      return NextResponse.json({ error: 'Invalid action. Use bulk_review or bulk_close' }, { status: 400 })
    }

    if (!Array.isArray(closures) || closures.length === 0) {
      return NextResponse.json({ error: 'closures array required' }, { status: 400 })
    }

    if (closures.length > 50) {
      return NextResponse.json({ error: 'Max 50 closures per request' }, { status: 400 })
    }

    const userName = getUserName(request)
    const validFields: StatusField[] = ['bank_statement_status', 'expense_documents_status', 'income_invoices_status']
    const results: Array<{ company_id: string; period: string; status: string }> = []
    const errors: Array<{ company_id: string; period: string; error: string }> = []

    for (const item of closures) {
      const { company_id, period, field, value } = item

      if (!company_id || !period) {
        errors.push({ company_id: company_id || '?', period: period || '?', error: 'Missing company_id or period' })
        continue
      }

      if (action === 'bulk_review') {
        // Review individual fields
        if (!field || !validFields.includes(field)) {
          errors.push({ company_id, period, error: 'Invalid field' })
          continue
        }
        const targetValue: StatusValue = (value === 'reviewed' || value === 'approved') ? value : 'reviewed'
        const closure = await upsertClosureField(company_id, period, field, targetValue, userId)
        results.push({ company_id, period, status: closure?.status || 'updated' })
      } else {
        // bulk_close — set all 3 fields to 'reviewed'
        for (const f of validFields) {
          await upsertClosureField(company_id, period, f, 'reviewed', userId)
        }
        results.push({ company_id, period, status: 'reviewed' })
      }
    }

    // Log activity for the batch
    if (results.length > 0) {
      await addActivity({
        type: 'closure_status_changed',
        company_id: results[0].company_id,
        company_name: '',
        title: `Hromadný ${action === 'bulk_review' ? 'review' : 'close'}: ${results.length} uzávěrek`,
        description: `${results.length} úspěšně, ${errors.length} chyb`,
        created_by: userName,
      })
    }

    return NextResponse.json({ success: true, results, errors })
  } catch (error) {
    console.error('Closure POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
