import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = request.nextUrl.searchParams.get('year')
  if (!year) {
    return NextResponse.json({ error: 'Missing year' }, { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('tax_rates')
      .select('*')
      .eq('year', parseInt(year))
      .maybeSingle()

    if (error) throw error

    return NextResponse.json(data || { year: parseInt(year), rates: null })
  } catch (error) {
    console.error('Tax rates API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { year, rates } = body

    if (!year || !rates) {
      return NextResponse.json({ error: 'Missing year or rates' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('tax_rates')
      .upsert(
        {
          year,
          rates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'year' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Tax rates upsert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
