import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin' && userRole !== 'accountant') {
    return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 })
  }

  try {
    const { docId } = await params

    const { data, error } = await supabaseAdmin
      .from('case_document_changes')
      .select('*')
      .eq('document_id', docId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch changes' }, { status: 500 })
    }

    return NextResponse.json({ changes: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
