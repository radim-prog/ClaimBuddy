import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id: taskId } = await params
    const { data, error } = await supabaseAdmin
      .from('case_progress_notes')
      .select('*')
      .eq('project_id', taskId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching task progress notes:', error)
      return NextResponse.json({ error: 'Failed to fetch progress notes' }, { status: 500 })
    }

    return NextResponse.json({ notes: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id: taskId } = await params
    const body = await request.json()
    const { current_status, problems, next_steps } = body

    if (!current_status) {
      return NextResponse.json({ error: 'Current status is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('case_progress_notes')
      .insert({
        project_id: taskId,
        author_id: userId,
        author_name: userName || 'Neznamy',
        current_status,
        problems: problems || null,
        next_steps: next_steps || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task progress note:', error)
      return NextResponse.json({ error: 'Failed to create progress note' }, { status: 500 })
    }

    return NextResponse.json({ note: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await params
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')
    if (!noteId) return NextResponse.json({ error: 'noteId is required' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('case_progress_notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      console.error('Error deleting task progress note:', error)
      return NextResponse.json({ error: 'Failed to delete progress note' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

