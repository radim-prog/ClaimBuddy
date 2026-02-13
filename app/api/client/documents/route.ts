import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDemoCompanyIds } from '@/lib/company-store'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companyIds = await getDemoCompanyIds()

    if (companyIds.length === 0) {
      return NextResponse.json({ documents: [], count: 0 })
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })
      .limit(100)

    if (error) throw new Error(error.message)

    const documents = (data ?? []).map(d => ({
      id: d.id,
      company_id: d.company_id,
      period: d.period,
      type: d.type,
      file_name: d.file_name,
      file_size_bytes: d.file_size_bytes || 0,
      status: d.status,
      uploaded_at: d.uploaded_at || d.created_at,
    }))

    return NextResponse.json({ documents, count: documents.length })
  } catch (error) {
    console.error('Client documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
