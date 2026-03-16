import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import {
  updateBillingConfig,
  activateBilling,
  pauseBilling,
  cancelBilling,
  getBillingInvoices,
} from '@/lib/billing-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ configId: string }> }

// GET: Single billing config with its invoices
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || !isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { configId } = await params

  try {
    const { data: config, error } = await supabaseAdmin
      .from('billing_configs')
      .select('*')
      .eq('id', configId)
      .eq('accountant_user_id', userId)
      .single()

    if (error || !config) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Get company name
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('name')
      .eq('id', config.company_id)
      .single()

    // Get invoices for this company
    const invoices = await getBillingInvoices({ companyId: config.company_id })

    return NextResponse.json({
      config: { ...config, company_name: company?.name || '' },
      invoices,
    })
  } catch (error) {
    console.error('[Billing config] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update config or change status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || !isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { configId } = await params

  let body: { action?: string; monthly_fee?: number; notes?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action, monthly_fee, notes } = body

  try {
    // Verify ownership — only the accountant who created the config can modify it
    const { data: config } = await supabaseAdmin
      .from('billing_configs')
      .select('accountant_user_id')
      .eq('id', configId)
      .single()

    if (!config || config.accountant_user_id !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    switch (action) {
      case 'activate': {
        const result = await activateBilling(configId)
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
        return NextResponse.json({ success: true })
      }
      case 'pause':
        await pauseBilling(configId)
        return NextResponse.json({ success: true })
      case 'cancel':
        await cancelBilling(configId)
        return NextResponse.json({ success: true })
      case 'update':
        await updateBillingConfig(configId, { monthly_fee, notes })
        return NextResponse.json({ success: true })
      default:
        return NextResponse.json({ error: 'Invalid action. Use: activate, pause, cancel, update' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Billing config] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
