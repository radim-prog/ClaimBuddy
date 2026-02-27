import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json()
    const { matched_document_id, matched_invoice_id, category } = body

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (matched_document_id !== undefined) {
      updates.matched_document_id = matched_document_id || null
      updates.match_method = matched_document_id ? 'manual' : null
      updates.match_confidence = matched_document_id ? 1.0 : null
      // Clear tax impact when matched
      if (matched_document_id) {
        updates.tax_impact = 0
        updates.vat_impact = 0
      }
    }

    if (matched_invoice_id !== undefined) {
      updates.matched_invoice_id = matched_invoice_id || null
      updates.match_method = matched_invoice_id ? 'manual' : null
      updates.match_confidence = matched_invoice_id ? 1.0 : null
    }

    if (category) {
      updates.category = category
    }

    const { data, error } = await supabaseAdmin
      .from('bank_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, transaction: data })
  } catch (error) {
    console.error('[BankTransaction] Match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
