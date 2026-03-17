import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generatePredavaciProtokol, DEFAULT_HANDOVER_ITEMS } from '@/lib/contract-templates/predavaci-protokol'
import type { HandoverItem } from '@/lib/contract-templates/predavaci-protokol'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ companyId: string }> }

// GET /api/accountant/companies/[companyId]/handover — list protocols
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { companyId } = await params

  try {
    const { data, error } = await supabaseAdmin
      .from('handover_protocols')
      .select('*, created_by_user:users!created_by(id, name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ protocols: data ?? [], defaults: DEFAULT_HANDOVER_ITEMS })
  } catch (error) {
    console.error('Handover GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/accountant/companies/[companyId]/handover — create protocol
export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { companyId } = await params

  try {
    const body = await request.json()
    const {
      from_name,
      from_role,
      to_name,
      to_role,
      handover_date,
      items,
      reason,
      notes,
    } = body

    if (!from_name?.trim() || !to_name?.trim()) {
      return NextResponse.json({ error: 'Předávající a přebírající jsou povinné' }, { status: 400 })
    }

    // Generate protocol number: PP-YYYY-NNN
    const year = new Date().getFullYear()
    const { count } = await supabaseAdmin
      .from('handover_protocols')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`)

    const seqNum = ((count ?? 0) + 1).toString().padStart(3, '0')
    const protocolNumber = `PP-${year}-${seqNum}`

    const protocolItems: HandoverItem[] = Array.isArray(items) && items.length > 0
      ? items
      : DEFAULT_HANDOVER_ITEMS

    const { data: protocol, error: insertError } = await supabaseAdmin
      .from('handover_protocols')
      .insert({
        company_id: companyId,
        protocol_number: protocolNumber,
        handover_date: handover_date || new Date().toISOString().split('T')[0],
        from_name: from_name.trim(),
        from_role: from_role?.trim() || null,
        to_name: to_name.trim(),
        to_role: to_role?.trim() || null,
        items: protocolItems,
        reason: reason || null,
        notes: notes?.trim() || null,
        status: 'draft',
        created_by: userId,
      })
      .select('*')
      .single()

    if (insertError) throw insertError

    // Fetch company info for text generation
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('name, ico')
      .eq('id', companyId)
      .single()

    // Generate text version
    const text = generatePredavaciProtokol({
      protocol_number: protocolNumber,
      handover_date: handover_date || new Date().toISOString().split('T')[0],
      from_name: from_name.trim(),
      from_role: from_role?.trim(),
      to_name: to_name.trim(),
      to_role: to_role?.trim(),
      company_name: company?.name ?? '',
      company_ico: company?.ico ?? '',
      items: protocolItems,
      reason,
      notes: notes?.trim(),
    })

    return NextResponse.json({ protocol, text }, { status: 201 })
  } catch (error) {
    console.error('Handover POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
