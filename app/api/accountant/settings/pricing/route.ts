import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { data } = await supabaseAdmin
      .from('pricing_settings')
      .select('settings')
      .eq('id', 'default')
      .maybeSingle()

    return NextResponse.json({ settings: data?.settings || null })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('pricing_settings')
      .upsert({
        id: 'default',
        settings: body,
        updated_at: new Date().toISOString(),
      })
      .select('settings')
      .single()

    if (error) throw error

    return NextResponse.json({ settings: data.settings })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
