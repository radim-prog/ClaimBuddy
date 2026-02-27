import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { invalidateSupplierCache } from '@/lib/supplier-loader'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('setting_key, setting_value')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const settings: Record<string, unknown> = {}
    for (const row of data || []) {
      settings[row.setting_key] = row.setting_value
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()

    // Numeric keys with validation
    const numericKeys: { key: string; validate?: (v: number) => boolean }[] = [
      { key: 'deadline_day', validate: (v) => v >= 1 && v <= 28 },
      { key: 'default_hourly_rate', validate: (v) => v >= 0 && v <= 100000 },
      { key: 'default_km_rate', validate: (v) => v >= 0 && v <= 1000 },
      { key: 'default_wasted_time_rate', validate: (v) => v >= 0 && v <= 100000 },
      { key: 'default_vat_rate', validate: (v) => v >= 0 && v <= 100 },
      { key: 'default_invoice_maturity', validate: (v) => v >= 1 && v <= 365 },
    ]

    for (const { key, validate } of numericKeys) {
      if (body[key] !== undefined) {
        const val = Number(body[key])
        if (isNaN(val) || (validate && !validate(val))) {
          return NextResponse.json({ error: `Invalid value for ${key}` }, { status: 400 })
        }

        const { error } = await supabaseAdmin
          .from('app_settings')
          .upsert({
            setting_key: key,
            setting_value: val,
            updated_at: new Date().toISOString(),
            updated_by: userId,
          })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // JSON/string keys (supplier_info, invoice_number_series, etc.)
    const jsonKeys = [
      'supplier_info',
      'invoice_number_series',
      'default_constant_symbol',
      'invoice_footer_text',
    ]

    for (const key of jsonKeys) {
      if (body[key] !== undefined) {
        const { error } = await supabaseAdmin
          .from('app_settings')
          .upsert({
            setting_key: key,
            setting_value: body[key],
            updated_at: new Date().toISOString(),
            updated_by: userId,
          })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Invalidate supplier cache when supplier_info changes
        if (key === 'supplier_info') invalidateSupplierCache()
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
