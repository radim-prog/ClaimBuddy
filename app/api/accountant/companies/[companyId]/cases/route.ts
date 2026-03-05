import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { companyId } = await params

    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('id, name, case_number, case_type_id, status, case_opened_at, case_closed_at, hourly_rate, client_visible, case_opposing_party, case_reference, client_visible_tabs')
      .eq('company_id', companyId)
      .eq('is_case', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cases:', error)
      return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
    }

    return NextResponse.json({ cases: data || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { companyId } = await params
    const body = await request.json()
    const { name, case_type_id, case_opposing_party, case_reference, hourly_rate } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        company_id: companyId,
        name,
        is_case: true,
        case_type_id: case_type_id || null,
        case_opposing_party: case_opposing_party || null,
        case_reference: case_reference || null,
        hourly_rate: hourly_rate || null,
        status: 'active',
        created_by: userId,
        created_by_name: userName || 'Neznámý',
      })
      .select('id, name, case_number, case_type_id, status, case_opened_at, hourly_rate, client_visible, case_opposing_party, case_reference')
      .single()

    if (error) {
      console.error('Error creating case:', error)
      return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
    }

    return NextResponse.json({ case: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
