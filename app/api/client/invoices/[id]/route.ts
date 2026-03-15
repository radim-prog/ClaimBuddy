import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapDbRowToInvoice } from '@/lib/invoice-utils'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

// Helper: check if user is staff (admin/accountant/assistant)
function isStaff(request: NextRequest): boolean {
  const role = request.headers.get('x-user-role')
  return ['admin', 'accountant', 'assistant'].includes(role || '')
}

// Helper: verify user can access this invoice's company
async function canAccessInvoice(request: NextRequest, companyId: string): Promise<boolean> {
  if (isStaff(request)) return true
  if (request.headers.get('x-impersonate-company') === companyId) return true

  const userId = request.headers.get('x-user-id')!
  const { data } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('owner_id', userId)
    .single()
  return !!data
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const { data: row, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !row) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!(await canAccessInvoice(request, row.company_id))) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Fetch supplier info from company
    let supplier = null
    if (row.company_id) {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('name, ico, dic, address')
        .eq('id', row.company_id)
        .single()
      if (company) {
        supplier = company
      }
    }

    return NextResponse.json({ invoice: mapDbRowToInvoice(row), supplier })
  } catch (error) {
    console.error('Client invoice GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json()

    // Only allow editing drafts
    const { data: existing } = await supabaseAdmin
      .from('invoices')
      .select('payment_status, sent_at, created_by, company_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!(await canAccessInvoice(request, existing.company_id))) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (existing.sent_at) {
      return NextResponse.json({ error: 'Cannot edit sent invoice' }, { status: 400 })
    }

    const allowedFields = [
      'partner', 'items', 'due_date', 'notes', 'total_without_vat', 'total_vat', 'total_with_vat',
      'payment_method', 'constant_symbol', 'specific_symbol',
      'issued_by', 'issued_by_phone', 'issued_by_email', 'partner_id', 'document_type',
      'issue_date',
    ]
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, invoice: mapDbRowToInvoice(data) })
  } catch (error) {
    console.error('Client invoice PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('id, company_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!(await canAccessInvoice(request, invoice.company_id))) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Client invoice DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
