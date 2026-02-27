import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = params
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()
  const type = searchParams.get('type') // optional filter

  try {
    let query = supabaseAdmin
      .from('vat_returns')
      .select('*')
      .eq('company_id', companyId)
      .order('period', { ascending: true })

    // Filter by year: period starts with YYYY
    query = query.like('period', `${year}%`)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ filings: data ?? [] })
  } catch (err) {
    console.error('Tax filings GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { period, type, status, filing_type, amount, tax_base, deductible, deadline, notes } = body

    if (!period || !type) {
      return NextResponse.json({ error: 'period and type are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('vat_returns')
      .insert({
        company_id: params.companyId,
        period,
        type,
        status: status || 'not_filed',
        filing_type: filing_type || 'regular',
        amount: amount || null,
        tax_base: tax_base || null,
        deductible: deductible || null,
        deadline: deadline || null,
        notes: notes || null,
        prepared_by: userId,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, filing: data })
  } catch (err) {
    console.error('Tax filing POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Only allow specific fields
    const allowed = ['status', 'filing_type', 'filing_reference', 'filed_date', 'amount',
      'tax_base', 'deductible', 'paid_date', 'deadline', 'filed_by', 'notes', 'document_ids']
    const safeUpdates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in updates) safeUpdates[key] = updates[key]
    }

    const { data, error } = await supabaseAdmin
      .from('vat_returns')
      .update(safeUpdates)
      .eq('id', id)
      .eq('company_id', params.companyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, filing: data })
  } catch (err) {
    console.error('Tax filing PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
