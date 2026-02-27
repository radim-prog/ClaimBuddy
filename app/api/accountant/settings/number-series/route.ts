import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { NumberSeries } from '@/lib/types/invoice-settings'

export const dynamic = 'force-dynamic'

const DEFAULT_SERIES: NumberSeries[] = [
  {
    id: 'default',
    prefix: 'FV',
    format: '{prefix}-{yyyy}-{nnnn}',
    next_number: 1,
    active: true,
    description: 'Tuzemske faktury',
  },
]

async function loadSeries(): Promise<NumberSeries[]> {
  const { data } = await supabaseAdmin
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', 'invoice_number_series')
    .single()

  if (data?.setting_value && Array.isArray(data.setting_value)) {
    return data.setting_value as NumberSeries[]
  }
  return DEFAULT_SERIES
}

async function saveSeries(series: NumberSeries[], userId: string) {
  return supabaseAdmin
    .from('app_settings')
    .upsert({
      setting_key: 'invoice_number_series',
      setting_value: series,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
}

// GET - list number series
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const series = await loadSeries()
    return NextResponse.json({ series })
  } catch (error) {
    console.error('Number series GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - add new series
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    if (!body.id || !body.prefix) {
      return NextResponse.json({ error: 'id and prefix are required' }, { status: 400 })
    }

    const series = await loadSeries()

    if (series.find(s => s.id === body.id)) {
      return NextResponse.json({ error: 'Series ID already exists' }, { status: 409 })
    }

    series.push({
      id: body.id,
      prefix: body.prefix,
      format: body.format || '{prefix}-{yyyy}-{nnnn}',
      next_number: Number(body.next_number) || 1,
      active: body.active !== false,
      description: body.description || '',
    })

    const { error } = await saveSeries(series, userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, series }, { status: 201 })
  } catch (error) {
    console.error('Number series POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - update series (next_number skip, prefix, format, active toggle)
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const series = await loadSeries()
    const idx = series.findIndex(s => s.id === body.id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }

    if (body.prefix !== undefined) series[idx].prefix = body.prefix
    if (body.format !== undefined) series[idx].format = body.format
    if (body.next_number !== undefined) series[idx].next_number = Number(body.next_number)
    if (body.active !== undefined) series[idx].active = body.active
    if (body.description !== undefined) series[idx].description = body.description

    const { error } = await saveSeries(series, userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, series })
  } catch (error) {
    console.error('Number series PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
