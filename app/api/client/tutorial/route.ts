import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { CLIENT_TUTORIAL_STEPS } from '@/lib/client-tutorial-steps'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: completed } = await supabaseAdmin
    .from('tutorial_progress')
    .select('step_id, completed_at')
    .eq('user_id', userId)

  const completedMap = new Map(
    (completed ?? []).map(r => [r.step_id, r.completed_at])
  )

  const steps = CLIENT_TUTORIAL_STEPS.map(step => ({
    id: step.id,
    title: step.title,
    description: step.description,
    href: step.page,
    completed: completedMap.has(step.id),
    completed_at: completedMap.get(step.id) || null,
  }))

  return NextResponse.json({
    steps,
    completed_count: completedMap.size,
    total_count: CLIENT_TUTORIAL_STEPS.length,
  })
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { step_id } = await request.json()

  if (!step_id || !CLIENT_TUTORIAL_STEPS.find(s => s.id === step_id)) {
    return NextResponse.json({ error: 'Invalid step_id' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('tutorial_progress')
    .upsert(
      { user_id: userId, step_id },
      { onConflict: 'user_id,step_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabaseAdmin
    .from('tutorial_progress')
    .delete()
    .eq('user_id', userId)

  return NextResponse.json({ success: true })
}
