import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const period = searchParams.get('period')

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let query = supabase
      .from('documents')
      .select(`
        id,
        company_id,
        period,
        type,
        file_name,
        google_drive_file_id,
        mime_type,
        file_size_bytes,
        ocr_processed,
        ocr_status,
        ocr_data,
        status,
        uploaded_by,
        uploaded_at,
        upload_source
      `)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (period) {
      query = query.eq('period', period)
    }

    const { data: documents, error: documentsError } = await query

    if (documentsError) {
      console.error('Documents error:', documentsError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Verify user has access to these documents (via company ownership)
    if (companyId) {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('owner_id, assigned_accountant_id')
        .eq('id', companyId)
        .single()

      if (companyError || (!company) ||
          (company.owner_id !== user.id && company.assigned_accountant_id !== user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({
      documents,
      count: documents.length,
    })
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
