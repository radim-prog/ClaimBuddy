import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET - list all knowledge base articles
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .select('*')
      .order('category')
      .order('sort_order')

    if (error) {
      console.error('Error fetching knowledge base:', error)
      return NextResponse.json({ error: 'Failed to fetch knowledge base' }, { status: 500 })
    }

    return NextResponse.json({ articles: data || [] })
  } catch (error) {
    console.error('Knowledge base API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - create new article (admin only)
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { category, title, content, source_url, sort_order } = body

    if (!category || !title) {
      return NextResponse.json({ error: 'Category and title are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .insert({
        category,
        title,
        content: content || '',
        source_url: source_url || null,
        sort_order: sort_order || 0,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating article:', error)
      return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
    }

    return NextResponse.json({ article: data })
  } catch (error) {
    console.error('Knowledge base POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - update article (admin only)
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 })
    }

    const ALLOWED_FIELDS = ['category', 'title', 'content', 'source_url', 'sort_order'] as const
    const updates: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      if (field in body) updates[field] = body[field]
    }

    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating article:', error)
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
    }

    return NextResponse.json({ article: data })
  } catch (error) {
    console.error('Knowledge base PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - delete article (admin only)
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('knowledge_base')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting article:', error)
      return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Knowledge base DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
