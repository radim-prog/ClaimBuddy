import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

/**
 * POST /api/extraction/reset
 * Reset a stuck document back to uploaded status
 * Body: { documentId: string }
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { documentId } = await request.json()
    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('documents')
      .update({
        status: 'uploaded',
        ocr_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('status', 'extracting')

    if (error) {
      return NextResponse.json({ error: 'Failed to reset document' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
