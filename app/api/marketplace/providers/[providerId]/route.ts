import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ providerId: string }> }

// GET — public single provider profile
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { providerId } = await params

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('marketplace_providers')
      .select('id, name, ico, dic, email, phone, website, street, city, zip, region, description, specializations, capacity_status, min_price, max_price, services, logo_url, featured, created_at')
      .eq('id', providerId)
      .eq('status', 'verified')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    return NextResponse.json({ provider: data })
  } catch (error) {
    console.error('[Marketplace provider detail]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
