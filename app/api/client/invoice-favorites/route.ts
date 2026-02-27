import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('client_invoice_favorites')
      .select('*')
      .eq('company_id', companyId)
      .order('usage_count', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ favorites: data || [] })
  } catch (error) {
    console.error('[InvoiceFavorites] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id, type, name, data } = body

    if (!company_id || !type || !name || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('client_invoice_favorites')
      .select('id, usage_count')
      .eq('company_id', company_id)
      .eq('type', type)
      .eq('name', name)
      .limit(1)

    if (existing && existing.length > 0) {
      // Update usage count
      await supabaseAdmin
        .from('client_invoice_favorites')
        .update({
          usage_count: (existing[0].usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
          data,
        })
        .eq('id', existing[0].id)

      return NextResponse.json({ success: true, id: existing[0].id, updated: true })
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('client_invoice_favorites')
      .insert({
        company_id,
        type,
        name,
        data,
        usage_count: 1,
        last_used_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: inserted.id })
  } catch (error) {
    console.error('[InvoiceFavorites] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('client_invoice_favorites')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[InvoiceFavorites] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
