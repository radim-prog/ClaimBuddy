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

    const { data, error } = await supabaseAdmin
      .from('case_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json({ documents: data })
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
    const { name, file_url, file_type, file_size_bytes, category, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Document name is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('case_documents')
      .insert({
        project_id: projectId,
        name,
        file_url,
        file_type,
        file_size_bytes,
        category: category || 'other',
        description,
        uploaded_by: userId,
        uploaded_by_name: userName || 'Unknown',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating document:', error)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    return NextResponse.json({ document: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
