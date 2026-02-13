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
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '50')
    const offset = (page - 1) * pageSize

    const { data, error, count } = await supabaseAdmin
      .from('case_timeline')
      .select('*', { count: 'exact' })
      .eq('project_id', projectId)
      .order('event_date', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error fetching timeline:', error)
      return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 })
    }

    return NextResponse.json({
      entries: data,
      pagination: {
        page,
        page_size: pageSize,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / pageSize),
      },
    })
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
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { event_type, title, description, task_id, document_url, metadata } = body

    if (!event_type || !title) {
      return NextResponse.json({ error: 'Event type and title are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('case_timeline')
      .insert({
        project_id: projectId,
        event_type,
        title,
        description,
        created_by: userId,
        created_by_name: userName || 'Unknown',
        task_id,
        document_url,
        metadata,
        event_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating timeline entry:', error)
      return NextResponse.json({ error: 'Failed to create timeline entry' }, { status: 500 })
    }

    return NextResponse.json({ entry: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
