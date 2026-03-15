import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'accountant' && userRole !== 'admin' && userRole !== 'assistant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const period = searchParams.get('period')

    let query = supabaseAdmin
      .from('documents')
      .select('*')
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (period) {
      query = query.eq('period', period)
    }

    const { data, error } = await query

    if (error) throw new Error(`Failed to fetch documents: ${error.message}`)

    const documents = (data ?? []).map(d => ({
      id: d.id,
      company_id: d.company_id,
      period: d.period,
      type: d.type,
      file_name: d.file_name,
      file_size_bytes: d.file_size_bytes || 0,
      status: d.status,
      uploaded_at: d.uploaded_at || d.created_at,
      uploaded_by: d.uploaded_by || '',
      upload_source: d.upload_source || 'web',
    }))

    return NextResponse.json({
      documents,
      count: documents.length,
    })
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
