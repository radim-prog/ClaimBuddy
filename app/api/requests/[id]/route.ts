/*
-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS client_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  company_id UUID NOT NULL REFERENCES companies(id),
  category TEXT CHECK (category IN ('document', 'question', 'task', 'other')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  response_to_client TEXT,
  internal_notes TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_client_requests_company ON client_requests(company_id);
CREATE INDEX idx_client_requests_status ON client_requests(status);
CREATE INDEX idx_client_requests_priority ON client_requests(priority);
CREATE INDEX idx_client_requests_assigned ON client_requests(assigned_to);
*/

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

/**
 * GET /api/requests/[id] - Get single request by ID
 *
 * Returns: Request object or 404 if not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication via middleware header
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID požadavku je povinné' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: requestData, error } = await supabase
      .from('client_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Požadavek nenalezen' },
          { status: 404 }
        )
      }
      console.error('Request fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ request: requestData })
  } catch (error: any) {
    console.error('GET request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/requests/[id] - Update request
 *
 * Body (all optional):
 * - title: string
 * - description: string
 * - category: 'document' | 'question' | 'task' | 'other'
 * - priority: 'low' | 'medium' | 'high' | 'urgent'
 * - status: 'new' | 'in_progress' | 'resolved' | 'closed'
 * - assigned_to: UUID | null
 * - response_to_client: string
 * - internal_notes: string
 * - attachments: string[]
 *
 * Returns: Updated request
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication via middleware header
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID požadavku je povinné' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const body = await request.json()

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.status !== undefined) updateData.status = body.status
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to
    if (body.response_to_client !== undefined) updateData.response_to_client = body.response_to_client
    if (body.internal_notes !== undefined) updateData.internal_notes = body.internal_notes
    if (body.attachments !== undefined) updateData.attachments = body.attachments

    // Validate enum fields if provided
    if (body.category) {
      const validCategories = ['document', 'question', 'task', 'other']
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: 'Neplatná kategorie. Povolené hodnoty: document, question, task, other' },
          { status: 400 }
        )
      }
    }

    if (body.priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent']
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          { error: 'Neplatná priorita. Povolené hodnoty: low, medium, high, urgent' },
          { status: 400 }
        )
      }
    }

    if (body.status) {
      const validStatuses = ['new', 'in_progress', 'resolved', 'closed']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Neplatný status. Povolené hodnoty: new, in_progress, resolved, closed' },
          { status: 400 }
        )
      }
    }

    // Update the request
    const { data: updatedRequest, error } = await supabase
      .from('client_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Požadavek nenalezen' },
          { status: 404 }
        )
      }
      console.error('Request update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ request: updatedRequest })
  } catch (error: any) {
    console.error('PUT request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/requests/[id] - Delete request
 *
 * Returns: 204 No Content on success
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication via middleware header
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID požadavku je povinné' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('client_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Request delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('DELETE request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
