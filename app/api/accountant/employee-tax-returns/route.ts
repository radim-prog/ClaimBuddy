import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = request.nextUrl.searchParams.get('company_id')
  const year = request.nextUrl.searchParams.get('year')

  if (!companyId || !year) {
    return NextResponse.json({ error: 'Missing company_id or year' }, { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('employee_tax_returns')
      .select('*, employees!inner(first_name, last_name, contract_type, tax_declaration)')
      .eq('company_id', companyId)
      .eq('year', parseInt(year))

    if (error) throw error

    return NextResponse.json({ returns: data || [] })
  } catch (error) {
    console.error('Employee tax returns GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id, employee_id, year, ...fields } = body

    if (!company_id || !employee_id || !year) {
      return NextResponse.json({ error: 'Missing company_id, employee_id, or year' }, { status: 400 })
    }

    // Auto-set completed_at when status changes to completed
    if (fields.status === 'completed' && !fields.completed_at) {
      fields.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('employee_tax_returns')
      .upsert(
        {
          company_id,
          employee_id,
          year,
          ...fields,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id,employee_id,year' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Employee tax returns PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
