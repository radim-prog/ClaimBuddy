import { NextRequest, NextResponse } from 'next/server'
import { getAllCompanies, createCompany, CreateCompanyInput } from '@/lib/company-store'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { DEFAULT_ONBOARDING_STEPS } from '@/lib/types/onboarding'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companies = await getAllCompanies()

    return NextResponse.json({
      companies: companies.map(c => ({
        id: c.id,
        name: c.name,
        group_name: c.group_name || null,
        ico: c.ico,
        dic: c.dic,
        legal_form: c.legal_form,
        vat_payer: c.vat_payer,
        vat_period: c.vat_period || null,
        owner_id: c.owner_id,
        assigned_accountant_id: c.assigned_accountant_id,
        address: c.address,
        bank_account: c.bank_account || null,
        has_employees: c.has_employees || false,
        phone: c.phone || null,
        email: c.email || null,
        status: c.status || 'active',
        reliability_score: c.reliability_score ?? 5,
        billing_settings: c.billing_settings || null,
        created_at: c.created_at,
      })),
      count: companies.length,
    })
  } catch (error) {
    console.error('Companies list API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authorization - only admin or accountant can create companies
    const userRole = request.headers.get('x-user-role')
    const userId = request.headers.get('x-user-id')

    if (!userRole || !['admin', 'accountant'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - only accountants or admins can create companies' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      name, 
      ico, 
      dic, 
      legal_form, 
      vat_payer, 
      vat_period,
      street,
      city,
      zip,
      email,
      phone,
      bank_account,
      assigned_accountant_id,
      has_employees,
    } = body

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Název firmy je povinný' },
        { status: 400 }
      )
    }

    if (!ico || !/^\d{8}$/.test(ico)) {
      return NextResponse.json(
        { error: 'IČO musí obsahovat přesně 8 číslic' },
        { status: 400 }
      )
    }

    if (!legal_form) {
      return NextResponse.json(
        { error: 'Právní forma je povinná' },
        { status: 400 }
      )
    }

    // Validate DIC format if provided (CZ + 8-10 digits)
    if (dic && !/^CZ\d{8,10}$/.test(dic)) {
      return NextResponse.json(
        { error: 'DIČ musí být ve formátu CZ následované 8-10 číslicemi' },
        { status: 400 }
      )
    }

    // Validate VAT period for VAT payers
    if (vat_payer && !vat_period) {
      return NextResponse.json(
        { error: 'Pro plátce DPH je nutné zadat periodicitu (měsíční/kvartální)' },
        { status: 400 }
      )
    }

    const companyData: CreateCompanyInput = {
      name: name.trim(),
      ico: ico.trim(),
      dic: dic?.trim() || null,
      legal_form: legal_form.trim(),
      vat_payer: Boolean(vat_payer),
      vat_period: vat_period || null,
      address: {
        street: street?.trim() || '',
        city: city?.trim() || '',
        zip: zip?.trim() || '',
      },
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      bank_account: bank_account?.trim() || null,
      assigned_accountant_id: assigned_accountant_id || userId || null,
      has_employees: Boolean(has_employees),
      status: 'onboarding', // New clients start in onboarding
    }

    const company = await createCompany(companyData)

    // Automatically create onboarding checklist for new company
    const onboardingSteps = body.onboarding_steps || DEFAULT_ONBOARDING_STEPS.map((step, index) => ({
      ...step,
      completed: false,
      order: index,
    }))

    await supabaseAdmin
      .from('onboarding_checklists')
      .insert({
        company_id: company.id,
        status: 'onboarding',
        priority: 'medium',
        steps: onboardingSteps,
        notes: [],
        assigned_to: userId,
        is_new_company_setup: false,
        is_restructuring: false,
      })

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        ico: company.ico,
        status: company.status,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Create company API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'

    if (errorMessage.includes('již existuje')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
