import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

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

export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('id, company_id, sent_at')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!(await canAccessCompany(request, invoice.company_id))) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Mark as sent (email integration can be added later)
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .update({
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, invoice: data })
  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
