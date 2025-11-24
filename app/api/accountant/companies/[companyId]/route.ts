import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const supabase = createServerClient()
    const { companyId } = params

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is accountant
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || userData?.role !== 'accountant') {
      return NextResponse.json({ error: 'Forbidden - Accountant only' }, { status: 403 })
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, ico, dic, vat_payer, legal_form, email, phone, address')
      .eq('id', companyId)
      .eq('assigned_accountant_id', user.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get monthly closures for this company
    const { data: closures, error: closuresError } = await supabase
      .from('monthly_closures')
      .select('*')
      .eq('company_id', companyId)
      .order('period', { ascending: false })

    if (closuresError) {
      console.error('Closures error:', closuresError)
    }

    return NextResponse.json({
      company,
      closures: closures || []
    })
  } catch (error) {
    console.error('Company detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
