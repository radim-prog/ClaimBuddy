import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('bank_accounts')
      .select('*')
      .eq('company_id', params.companyId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('label', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ accounts: data ?? [] })
  } catch (err) {
    console.error('Bank accounts GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (userRole === 'assistant') return NextResponse.json({ error: 'Forbidden: assistants cannot manage bank accounts' }, { status: 403 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { account_number, bank_code, bank_name, iban, swift, currency, label, import_format, is_primary } = body

    if (!account_number) {
      return NextResponse.json({ error: 'account_number is required' }, { status: 400 })
    }

    // If setting as primary, unset other primary accounts
    if (is_primary) {
      await supabaseAdmin
        .from('bank_accounts')
        .update({ is_primary: false })
        .eq('company_id', params.companyId)
    }

    const { data, error } = await supabaseAdmin
      .from('bank_accounts')
      .insert({
        company_id: params.companyId,
        account_number,
        bank_code: bank_code || null,
        bank_name: bank_name || null,
        iban: iban || null,
        swift: swift || null,
        currency: currency || 'CZK',
        label: label || null,
        import_format: import_format || null,
        is_primary: is_primary || false,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, account: data })
  } catch (err) {
    console.error('Bank account POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (userRole === 'assistant') return NextResponse.json({ error: 'Forbidden: assistants cannot manage bank accounts' }, { status: 403 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const allowed = ['account_number', 'bank_code', 'bank_name', 'iban', 'swift',
      'currency', 'label', 'import_format', 'is_primary', 'is_active']
    const safeUpdates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in updates) safeUpdates[key] = updates[key]
    }
    safeUpdates.updated_at = new Date().toISOString()

    // If setting as primary, unset others first
    if (safeUpdates.is_primary === true) {
      await supabaseAdmin
        .from('bank_accounts')
        .update({ is_primary: false })
        .eq('company_id', params.companyId)
    }

    const { data, error } = await supabaseAdmin
      .from('bank_accounts')
      .update(safeUpdates)
      .eq('id', id)
      .eq('company_id', params.companyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, account: data })
  } catch (err) {
    console.error('Bank account PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
