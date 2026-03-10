import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { lookupByIco, validateIco } from '@/lib/ares'

export const dynamic = 'force-dynamic'

// GET /api/client/partners?company_id=xxx
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = request.nextUrl.searchParams.get('company_id')
  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 })

  // Verify ownership
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('owner_id', userId)
    .single()

  if (!company) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('invoice_partners')
    .select('*')
    .eq('company_id', companyId)
    .order('usage_count', { ascending: false })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ partners: data ?? [] })
}

// POST /api/client/partners — create new partner (with optional ARES lookup)
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { company_id, name, ico, dic, address, city, postal_code, email, phone, bank_account, iban, note } = body

  if (!company_id || !name) {
    return NextResponse.json({ error: 'company_id and name required' }, { status: 400 })
  }

  // Verify ownership
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('id', company_id)
    .eq('owner_id', userId)
    .single()

  if (!company) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  // If ICO provided, try ARES auto-fill
  let aresData: Record<string, string | null> = {}
  if (ico && validateIco(ico)) {
    try {
      const ares = await lookupByIco(ico)
      if (ares) {
        aresData = {
          dic: ares.dic || dic || null,
          address: ares.address?.street || address || null,
          city: ares.address?.city || city || null,
          postal_code: ares.address?.zip || postal_code || null,
        }
      }
    } catch {
      // ARES lookup is optional
    }
  }

  const partnerData = {
    company_id,
    name,
    ico: ico || null,
    dic: aresData.dic || dic || null,
    address: aresData.address || address || null,
    city: aresData.city || city || null,
    postal_code: aresData.postal_code || postal_code || null,
    email: email || null,
    phone: phone || null,
    bank_account: bank_account || null,
    iban: iban || null,
    note: note || null,
  }

  const { data, error } = await supabaseAdmin
    .from('invoice_partners')
    .insert(partnerData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ partner: data }, { status: 201 })
}
