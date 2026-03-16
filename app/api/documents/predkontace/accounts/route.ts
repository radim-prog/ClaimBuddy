export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data: accounts, error } = await supabaseAdmin
    .from('chart_of_accounts')
    .select('account_number, account_name')
    .eq('is_active', true)
    .order('account_number')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ accounts: accounts || [] })
}
