import { NextRequest, NextResponse } from 'next/server'
import { getCompanyById, updateCompany } from '@/lib/company-store'
import { getClosuresByCompany } from '@/lib/closure-store-db'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { companyId } = params

    const company = await getCompanyById(companyId)

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const [closures, empCount] = await Promise.all([
      getClosuresByCompany(companyId),
      supabaseAdmin.from('employees').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('active', true),
    ])

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        group_name: company.group_name || null,
        ico: company.ico,
        dic: company.dic,
        vat_payer: company.vat_payer,
        vat_period: company.vat_period || null,
        legal_form: company.legal_form,
        street: company.address?.street || null,
        city: company.address?.city || null,
        zip: company.address?.zip || null,
        bank_account: company.bank_account || null,
        health_insurance_company: (company as unknown as Record<string, unknown>).health_insurance_company as string | null ?? null,
        has_employees: company.has_employees || false,
        monthly_reporting: company.monthly_reporting ?? true,
        employee_count: empCount.count || 0,
        data_box: null,
        phone: company.phone || null,
        email: company.email || null,
        status: company.status || 'active',
        accounting_start_date: (company as unknown as Record<string, unknown>).accounting_start_date as string | null ?? null,
        notification_preferences: company.notification_preferences || null,
        managing_director: company.managing_director || null,
      },
      closures,
    })
  } catch (error) {
    console.error('Company detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { companyId } = params
    const body = await request.json()

    const existing = await getCompanyById(companyId)
    if (!existing) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Map flat form fields to DB structure
    const updates: Record<string, unknown> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.group_name !== undefined) updates.group_name = body.group_name || null
    if (body.ico !== undefined) updates.ico = body.ico
    if (body.dic !== undefined) updates.dic = body.dic || null
    if (body.legal_form !== undefined) updates.legal_form = body.legal_form
    if (body.vat_payer !== undefined) updates.vat_payer = body.vat_payer
    if (body.vat_period !== undefined) updates.vat_period = body.vat_period || null
    if (body.bank_account !== undefined) updates.bank_account = body.bank_account || null
    if (body.has_employees !== undefined) updates.has_employees = body.has_employees
    if (body.monthly_reporting !== undefined) updates.monthly_reporting = body.monthly_reporting
    if (body.phone !== undefined) updates.phone = body.phone || null
    if (body.email !== undefined) updates.email = body.email || null
    if (body.status !== undefined) updates.status = body.status
    if (body.notification_preferences !== undefined) updates.notification_preferences = body.notification_preferences
    if (body.accounting_start_date !== undefined) updates.accounting_start_date = body.accounting_start_date || null
    if (body.billing_settings !== undefined) updates.billing_settings = body.billing_settings
    if (body.managing_director !== undefined) updates.managing_director = body.managing_director || null

    // Address is stored as JSONB object in DB
    if (body.street !== undefined || body.city !== undefined || body.zip !== undefined) {
      updates.address = {
        street: body.street ?? existing.address?.street ?? '',
        city: body.city ?? existing.address?.city ?? '',
        zip: body.zip ?? existing.address?.zip ?? '',
      }
    }

    const updated = await updateCompany(companyId, updates)
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
    }

    return NextResponse.json({ success: true, company: updated })
  } catch (error) {
    console.error('Company update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
