import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapDbRowToInvoice } from '@/lib/invoice-utils'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

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

    return NextResponse.json({ invoice: mapDbRowToInvoice(row) })
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
      .select('payment_status, sent_at, created_by')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
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
