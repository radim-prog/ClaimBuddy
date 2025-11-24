import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const supabase = createServerClient()
    const { documentId } = params
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

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

    // Get document to check access
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, company_id, type, period')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Verify accountant has access to this company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('assigned_accountant_id')
      .eq('id', document.company_id)
      .single()

    if (companyError || company?.assigned_accountant_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update document status
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to reject document' }, { status: 500 })
    }

    // Update monthly_closure status back to missing (since document was rejected)
    const statusField = document.type === 'bank_statement' ? 'bank_statement_status' :
                       document.type === 'expense_invoice' ? 'expense_invoices_status' :
                       document.type === 'income_invoice' ? 'income_invoices_status' :
                       document.type === 'receipt' ? 'receipts_status' : null

    if (statusField) {
      await supabase
        .from('monthly_closures')
        .update({
          [statusField]: 'missing',
          updated_at: new Date().toISOString()
        })
        .eq('company_id', document.company_id)
        .eq('period', document.period)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reject API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
