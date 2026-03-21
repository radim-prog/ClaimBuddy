import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/client/data-export
 * GDPR Article 20: Data portability — export all personal data as JSON
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. User profile (WITHOUT password_hash)
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, email, login_name, role, status, phone, created_at, gdpr_consent_at, gdpr_consent_version')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Companies owned by user
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id, name, ico, dic, legal_form, vat_payer, status, address, managing_director, created_at')
      .eq('owner_id', userId)
      .is('deleted_at', null)

    const companyIds = (companies || []).map(c => c.id)

    // 3. Documents metadata (no file content)
    let documents: any[] = []
    if (companyIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('documents')
        .select('id, company_id, filename, type, status, created_at, ocr_status')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false })
        .limit(500)
      documents = data || []
    }

    // 4. Invoices
    let invoices: any[] = []
    if (companyIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('invoices')
        .select('id, company_id, invoice_number, document_type, status, total_with_vat, issue_date, due_date, created_at')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false })
        .limit(500)
      invoices = data || []
    }

    // 5. Monthly closures
    let closures: any[] = []
    if (companyIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('monthly_closures')
        .select('company_id, period, bank_statement_status, expense_documents_status, income_invoices_status')
        .in('company_id', companyIds)
        .order('period', { ascending: false })
        .limit(500)
      closures = data || []
    }

    // 6. Messages sent by user
    const { data: messages } = await supabaseAdmin
      .from('chat_messages')
      .select('id, chat_id, content, sender_type, created_at')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(500)

    // 7. Travel trips
    let trips: any[] = []
    if (companyIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('travel_trips')
        .select('id, company_id, date, origin, destination, distance_km, purpose, created_at')
        .in('company_id', companyIds)
        .order('date', { ascending: false })
        .limit(500)
      trips = data || []
    }

    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        format_version: '1.0',
        gdpr_article: 'Article 20 — Right to data portability',
      },
      user,
      companies: companies || [],
      documents,
      invoices,
      closures,
      messages: messages || [],
      travel_trips: trips,
    }

    const jsonStr = JSON.stringify(exportData, null, 2)

    // Log export
    await supabaseAdmin.from('gdpr_data_exports').insert({
      user_id: userId,
      export_type: 'full',
      completed_at: new Date().toISOString(),
      file_size_bytes: Buffer.byteLength(jsonStr, 'utf-8'),
    })

    const date = new Date().toISOString().slice(0, 10)
    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="moje-data-${date}.json"`,
      },
    })
  } catch (error) {
    console.error('[data-export GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
