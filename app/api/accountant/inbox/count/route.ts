import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || !isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { count } = await supabaseAdmin
      .from('document_inbox_items')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('Inbox count error:', error)
    return NextResponse.json({ count: 0 })
  }
}
