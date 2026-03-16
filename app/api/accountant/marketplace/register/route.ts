import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// POST — register accountant firm in marketplace
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      company_id, name, ico, dic, legal_form,
      email, phone, website,
      street, city, zip, region,
      description, specializations, capacity_status,
      min_price, max_price, services,
    } = body

    // Validate required fields
    if (!name || !ico || !email || !city) {
      return NextResponse.json({
        error: 'Povinná pole: název, IČO, email, město',
      }, { status: 400 })
    }

    // Validate ICO format (8 digits)
    if (!/^\d{8}$/.test(ico)) {
      return NextResponse.json({ error: 'IČO musí mít 8 číslic' }, { status: 400 })
    }

    // Check for duplicate ICO
    const { data: existing } = await supabaseAdmin
      .from('marketplace_providers')
      .select('id, status')
      .eq('ico', ico)
      .single()

    if (existing) {
      if (existing.status === 'rejected') {
        // Allow re-registration if previously rejected
        const { data, error } = await supabaseAdmin
          .from('marketplace_providers')
          .update({
            user_id: userId,
            company_id: company_id || null,
            name, dic, legal_form,
            email, phone, website,
            street, city, zip, region,
            description,
            specializations: specializations || [],
            capacity_status: capacity_status || 'accepting',
            min_price: min_price || null,
            max_price: max_price || null,
            services: services || [],
            status: 'pending',
            rejection_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          console.error('[Marketplace register]', error)
          return NextResponse.json({ error: 'Chyba při registraci' }, { status: 500 })
        }

        return NextResponse.json({ provider: data, reregistered: true }, { status: 200 })
      }

      return NextResponse.json({
        error: 'Firma s tímto IČO je již registrována v marketplace',
        status: existing.status,
      }, { status: 409 })
    }

    const { data, error } = await supabaseAdmin
      .from('marketplace_providers')
      .insert({
        user_id: userId,
        company_id: company_id || null,
        name, ico, dic, legal_form,
        email, phone, website,
        street, city, zip, region,
        description,
        specializations: specializations || [],
        capacity_status: capacity_status || 'accepting',
        min_price: min_price || null,
        max_price: max_price || null,
        services: services || [],
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('[Marketplace register]', error)
      return NextResponse.json({ error: 'Chyba při registraci' }, { status: 500 })
    }

    return NextResponse.json({ provider: data }, { status: 201 })
  } catch (error) {
    console.error('[Marketplace register]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET — check current user's marketplace registration status
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data } = await supabaseAdmin
      .from('marketplace_providers')
      .select('*')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({ provider: data || null })
  } catch (error) {
    console.error('[Marketplace register GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
