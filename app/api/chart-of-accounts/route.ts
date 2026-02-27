import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET - list chart of accounts (optional filter: class, type, search)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const accountClass = searchParams.get('class')
    const accountType = searchParams.get('type')
    const search = searchParams.get('search')
    const activeOnly = searchParams.get('active_only') !== 'false'

    let query = supabaseAdmin
      .from('chart_of_accounts')
      .select('*')
      .order('account_number', { ascending: true })

    if (activeOnly) query = query.eq('is_active', true)
    if (accountClass) query = query.eq('account_class', parseInt(accountClass))
    if (accountType) query = query.eq('account_type', accountType)
    if (search) query = query.or(`account_number.ilike.%${search}%,account_name.ilike.%${search}%`)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ accounts: data || [] })
  } catch (err) {
    console.error('Chart of accounts GET error:', err)
    return NextResponse.json({ error: 'Chyba při načítání účtové osnovy' }, { status: 500 })
  }
}
