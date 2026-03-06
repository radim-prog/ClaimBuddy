import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  try {
    const { id: taskId, itemId } = params
    const body = await request.json()
    const { completed, completed_by, completed_at } = body

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('task_checklist_items')
      .select('id, task_id')
      .eq('id', itemId)
      .eq('task_id', taskId)
      .single()

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Checklist položka nenalezena' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('task_checklist_items')
      .update({
        completed: !!completed,
        completed_by: completed ? (completed_by || userId) : null,
        completed_at: completed ? (completed_at || new Date().toISOString()) : null,
      })
      .eq('id', itemId)
      .eq('task_id', taskId)
      .select()
      .single()

    if (error) {
      console.error('Checklist update error:', error)
      return NextResponse.json({ error: 'Nepodařilo se uložit checklist položku' }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (error: any) {
    console.error('Checklist PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
