import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const STALE_THRESHOLD_MS = 30_000 // 30s = stale presence
const LOCK_THRESHOLD_MS = 15_000  // 15s = stale lock

// POST — heartbeat (upsert presence + soft lock)
export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name') || 'Unknown'
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId, page } = await request.json()

  // Upsert presence record
  await supabaseAdmin.from('extraction_presence').upsert({
    user_id: userId,
    user_name: userName,
    document_id: documentId || null,
    page: page || 'verify',
    last_heartbeat: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // Soft lock logic
  if (documentId) {
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('locked_by, locked_at')
      .eq('id', documentId)
      .single()

    const isStale = doc?.locked_at &&
      (Date.now() - new Date(doc.locked_at).getTime()) > LOCK_THRESHOLD_MS

    if (!doc?.locked_by || doc.locked_by === userId || isStale) {
      // Acquire or refresh lock
      await supabaseAdmin.from('documents').update({
        locked_by: userId,
        locked_at: new Date().toISOString(),
      }).eq('id', documentId)

      return NextResponse.json({ locked: true, conflict: false })
    } else {
      // Conflict — another user holds the lock
      const { data: locker } = await supabaseAdmin
        .from('extraction_presence')
        .select('user_name')
        .eq('user_id', doc.locked_by)
        .single()

      return NextResponse.json({
        locked: false,
        conflict: true,
        locked_by: doc.locked_by,
        locked_by_name: locker?.user_name || 'Jiný uživatel',
      })
    }
  }

  // Release any previously held locks by this user
  await supabaseAdmin.from('documents')
    .update({ locked_by: null, locked_at: null })
    .eq('locked_by', userId)

  return NextResponse.json({ ok: true })
}

// GET — active users in extraction section
export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = Date.now()

  // Cleanup stale presence records
  await supabaseAdmin.from('extraction_presence')
    .delete()
    .lt('last_heartbeat', new Date(now - STALE_THRESHOLD_MS).toISOString())

  // Unlock stale documents
  await supabaseAdmin.from('documents')
    .update({ locked_by: null, locked_at: null })
    .lt('locked_at', new Date(now - LOCK_THRESHOLD_MS).toISOString())
    .not('locked_by', 'is', null)

  // Fetch active users
  const { data: presences } = await supabaseAdmin
    .from('extraction_presence')
    .select('user_id, user_name, document_id, page, last_heartbeat')
    .gte('last_heartbeat', new Date(now - STALE_THRESHOLD_MS).toISOString())

  return NextResponse.json({ users: presences || [] })
}

// DELETE — explicit leave (beforeunload / unmount)
export async function DELETE(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Remove presence
  await supabaseAdmin.from('extraction_presence')
    .delete().eq('user_id', userId)

  // Unlock any documents held by this user
  await supabaseAdmin.from('documents')
    .update({ locked_by: null, locked_at: null })
    .eq('locked_by', userId)

  return NextResponse.json({ ok: true })
}
