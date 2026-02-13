import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { DEFAULT_ONBOARDING_STEPS } from '@/lib/types/onboarding'

export const dynamic = 'force-dynamic'

// GET - list companies with onboarding data
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    // Fetch onboarding checklists with company data
    let query = supabaseAdmin
      .from('onboarding_checklists')
      .select(`
        *,
        company:companies(id, name, ico, email, status, legal_form)
      `)
      .order('last_activity_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data: checklists, error } = await query

    if (error) {
      console.error('Error fetching onboarding checklists:', error)
      return NextResponse.json({ error: 'Failed to fetch onboarding data' }, { status: 500 })
    }

    // Transform to match frontend types
    const companies = (checklists || [])
      .filter(c => c.company) // ensure company exists
      .map(checklist => ({
        id: checklist.company.id,
        name: checklist.company.name,
        ico: checklist.company.ico,
        email: checklist.company.email,
        status: checklist.company.status || 'onboarding',
        legal_form: checklist.company.legal_form,
        onboarding: {
          status: checklist.status,
          started_at: checklist.started_at,
          completed_at: checklist.completed_at,
          last_activity_at: checklist.last_activity_at,
          assigned_to: checklist.assigned_to,
          priority: checklist.priority,
          steps: checklist.steps || [],
          notes: checklist.notes || [],
          is_new_company_setup: checklist.is_new_company_setup,
          is_restructuring: checklist.is_restructuring,
          previous_accountant: checklist.previous_accountant,
        },
      }))

    return NextResponse.json({ companies })
  } catch (error) {
    console.error('Onboarding API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - create onboarding checklist for a company
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { company_id, priority, steps, is_new_company_setup, is_restructuring, previous_accountant } = body

    if (!company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    // Use provided steps or defaults
    const onboardingSteps = steps || DEFAULT_ONBOARDING_STEPS.map((step, index) => ({
      ...step,
      completed: false,
      order: index,
    }))

    const { data, error } = await supabaseAdmin
      .from('onboarding_checklists')
      .insert({
        company_id,
        status: 'onboarding',
        priority: priority || 'medium',
        steps: onboardingSteps,
        notes: [],
        assigned_to: userId,
        is_new_company_setup: is_new_company_setup || false,
        is_restructuring: is_restructuring || false,
        previous_accountant: previous_accountant || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating onboarding checklist:', error)
      return NextResponse.json({ error: 'Failed to create onboarding checklist' }, { status: 500 })
    }

    return NextResponse.json({ success: true, checklist: data }, { status: 201 })
  } catch (error) {
    console.error('Onboarding POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - update onboarding checklist
export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id, steps, notes, status, priority } = body

    if (!company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    const updates: Record<string, any> = {
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (steps !== undefined) updates.steps = steps
    if (notes !== undefined) updates.notes = notes
    if (status !== undefined) updates.status = status
    if (priority !== undefined) updates.priority = priority

    // If completing onboarding, set completed_at
    if (status === 'active') {
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('onboarding_checklists')
      .update(updates)
      .eq('company_id', company_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating onboarding checklist:', error)
      return NextResponse.json({ error: 'Failed to update onboarding checklist' }, { status: 500 })
    }

    // If status changed to 'active', also update company status
    if (status === 'active') {
      await supabaseAdmin
        .from('companies')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', company_id)
    }

    return NextResponse.json({ success: true, checklist: data })
  } catch (error) {
    console.error('Onboarding PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
