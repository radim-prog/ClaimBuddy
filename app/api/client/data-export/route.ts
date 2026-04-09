import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserCompanyIds } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

async function safeSelect<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>, fallback: T): Promise<T> {
  const { data, error } = await query
  if (error) {
    console.warn('[data-export safeSelect]', error.message)
    return fallback
  }
  return data ?? fallback
}

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

    const companyIds = await getUserCompanyIds(userId)
    const { data: companies } = companyIds.length > 0
      ? await supabaseAdmin
          .from('companies')
          .select('id, name, ico, dic, legal_form, vat_payer, status, address, managing_director, created_at')
          .in('id', companyIds)
          .is('deleted_at', null)
      : { data: [] as any[] }

    // 3. Documents metadata (no file content)
    const documents = companyIds.length > 0
      ? await safeSelect(
          supabaseAdmin
            .from('documents')
            .select('id, company_id, file_name, type, status, created_at, ocr_status')
            .in('company_id', companyIds)
            .order('created_at', { ascending: false })
            .limit(500),
          []
        )
      : []

    // 4. Invoices
    const invoices = companyIds.length > 0
      ? await safeSelect(
          supabaseAdmin
            .from('invoices')
            .select('id, company_id, invoice_number, document_type, status, total_with_vat, issue_date, due_date, created_at')
            .in('company_id', companyIds)
            .order('created_at', { ascending: false })
            .limit(500),
          []
        )
      : []

    // 5. Monthly closures
    const closures = companyIds.length > 0
      ? await safeSelect(
          supabaseAdmin
            .from('monthly_closures')
            .select('company_id, period, bank_statement_status, expense_invoices_status, income_invoices_status')
            .in('company_id', companyIds)
            .order('period', { ascending: false })
            .limit(500),
          []
        )
      : []

    // 6. Messages sent by user
    const rawMessages = await safeSelect(
      supabaseAdmin
        .from('chat_messages')
        .select('id, chat_id, text, sender_type, created_at')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })
        .limit(500),
      []
    )
    const messages = rawMessages.map((message: any) => ({
      ...message,
      content: message.text,
    }))

    // 7. Travel trips
    const trips = companyIds.length > 0
      ? await safeSelect(
          supabaseAdmin
            .from('travel_trips')
            .select('id, company_id, date, origin, destination, distance_km, purpose, created_at')
            .in('company_id', companyIds)
            .order('date', { ascending: false })
            .limit(500),
          []
        )
      : []

    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        format_version: '1.0',
        gdpr_article: 'Article 20 — Right to data portability',
      },
      user,
      companies: companies || [],
      documents: documents.map((document: any) => ({
        ...document,
        filename: document.file_name,
      })),
      invoices,
      closures,
      messages,
      travel_trips: trips,
    }

    const jsonStr = JSON.stringify(exportData, null, 2)

    // Log export
    const { error: exportLogError } = await supabaseAdmin.from('gdpr_data_exports').insert({
      user_id: userId,
      export_type: 'full',
      completed_at: new Date().toISOString(),
      file_size_bytes: Buffer.byteLength(jsonStr, 'utf-8'),
    })

    if (exportLogError) {
      console.warn('[data-export log insert]', exportLogError.message)
    }

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
