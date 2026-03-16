import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { lookupByIco, validateIco } from '@/lib/ares'
import { notifyAccountantOfDeletion } from '@/lib/client-deletion'

export const dynamic = 'force-dynamic'

function isStaff(request: NextRequest): boolean {
  const role = request.headers.get('x-user-role')
  return ['admin', 'accountant', 'assistant'].includes(role || '')
}

async function canAccessCompany(request: NextRequest, companyId: string): Promise<boolean> {
  if (isStaff(request)) return true
  if (request.headers.get('x-impersonate-company') === companyId) return true
  const userId = request.headers.get('x-user-id')!
  const { data } = await supabaseAdmin.from('companies').select('id').eq('id', companyId).eq('owner_id', userId).single()
  return !!data
}

// GET /api/client/partners?company_id=xxx
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = request.nextUrl.searchParams.get('company_id')
  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 })

  if (!(await canAccessCompany(request, companyId))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

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

  if (!(await canAccessCompany(request, company_id))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

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

// PATCH /api/client/partners — update partner or increment usage
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { partner_id, company_id, ...fields } = body

  if (!partner_id) {
    return NextResponse.json({ error: 'partner_id required' }, { status: 400 })
  }

  // Fetch partner to check company access
  const { data: partner } = await supabaseAdmin
    .from('invoice_partners')
    .select('id, company_id, usage_count')
    .eq('id', partner_id)
    .single()

  if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 })

  if (!(await canAccessCompany(request, partner.company_id))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // If only partner_id provided (no other fields), increment usage_count
  const hasUpdateFields = Object.keys(fields).some(k => !['company_id'].includes(k) && fields[k] !== undefined)

  if (!hasUpdateFields) {
    const { error } = await supabaseAdmin
      .from('invoice_partners')
      .update({ usage_count: (partner.usage_count || 0) + 1 })
      .eq('id', partner_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Update partner fields
  const allowedFields = ['name', 'ico', 'dic', 'address', 'city', 'postal_code', 'email', 'phone', 'bank_account', 'iban', 'note']
  const updates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (fields[key] !== undefined) updates[key] = fields[key] || null
  }

  const { data, error } = await supabaseAdmin
    .from('invoice_partners')
    .update(updates)
    .eq('id', partner_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ partner: data })
}

// DELETE /api/client/partners
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const partnerId = request.nextUrl.searchParams.get('id')
  if (!partnerId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: partner } = await supabaseAdmin
    .from('invoice_partners')
    .select('id, company_id')
    .eq('id', partnerId)
    .single()

  if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 })

  if (!(await canAccessCompany(request, partner.company_id))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Get partner details for notification
  const { data: partnerDetail } = await supabaseAdmin
    .from('invoice_partners')
    .select('name, ico')
    .eq('id', partnerId)
    .single()

  const { error } = await supabaseAdmin
    .from('invoice_partners')
    .delete()
    .eq('id', partnerId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify accountant if company has one
  const desc = partnerDetail
    ? `${partnerDetail.name || 'Partner'}${partnerDetail.ico ? ` (IČO: ${partnerDetail.ico})` : ''}`
    : `Partner #${partnerId}`
  await notifyAccountantOfDeletion({
    companyId: partner.company_id,
    deletedBy: userId,
    itemType: 'partnera z adresáře',
    itemDescription: desc,
  }).catch(() => {})

  return NextResponse.json({ success: true })
}
