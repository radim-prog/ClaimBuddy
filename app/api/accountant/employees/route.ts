import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET — list employees for a company (query param: company_id)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const companyId = request.nextUrl.searchParams.get('company_id')
  if (!companyId) return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })

  const contractType = request.nextUrl.searchParams.get('contract_type') // optional filter: dpp, dpc, hpp

  let query = supabaseAdmin
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .order('last_name')

  if (contractType) {
    query = query.eq('contract_type', contractType)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ employees: data ?? [] })
}

// POST — create a new employee
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { company_id, first_name, last_name, position, employment_start, contract_type } = body

  if (!company_id || !first_name || !last_name || !employment_start) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('employees')
    .insert({
      company_id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      position: position?.trim() || null,
      employment_start,
      employment_end: body.employment_end || null,
      contract_type: contract_type || 'hpp',
      base_salary: body.base_salary ?? 0,
      wage_type: body.wage_type || 'fixed',
      hourly_rate: body.hourly_rate ?? null,
      birth_date: body.birth_date || null,
      personal_id: body.personal_id || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      health_insurance: body.health_insurance || '111',
      social_insurance: body.social_insurance ?? true,
      tax_declaration: body.tax_declaration ?? false,
      tax_bonus_children: body.tax_bonus_children ?? 0,
      disability_level: body.disability_level ?? 0,
      student: body.student ?? false,
      deductions: body.deductions ?? [],
      bank_account: body.bank_account || null,
      notes: body.notes || null,
      active: body.active ?? true,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ employee: data }, { status: 201 })
}

// PUT — update an employee
export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'Missing employee id' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('employees')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ employee: data })
}

// DELETE — delete an employee
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const employeeId = request.nextUrl.searchParams.get('id')
  if (!employeeId) return NextResponse.json({ error: 'Missing employee id' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('employees')
    .delete()
    .eq('id', employeeId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
