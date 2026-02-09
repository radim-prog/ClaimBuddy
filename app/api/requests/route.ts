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
 * GET /api/requests - List all requests with filters
 *
 * Query params:
 * - status: RequestStatus (can be comma-separated for multiple: new,in_progress,resolved,closed)
 * - priority: PriorityLevel (can be comma-separated: low,medium,high,urgent)
 * - company_id: UUID - Filter by company
 * - assigned_to: UUID - Filter by assignee
 * - category: Category (can be comma-separated: document,question,task,other)
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 * - sort_by: field to sort by (default: created_at)
 * - sort_order: 'asc' | 'desc' (default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication via middleware header
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const supabase = createServerClient()

    // Parse query parameters
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')?.split(',')
    const priority = searchParams.get('priority')?.split(',')
    const companyId = searchParams.get('company_id')
    const assignedTo = searchParams.get('assigned_to')
    const category = searchParams.get('category')?.split(',')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Build query
    let query = supabase
      .from('client_requests')
      .select('*', { count: 'exact' })

    // Apply filters
    if (status && status.length > 0) {
      query = query.in('status', status)
    }

    if (priority && priority.length > 0) {
      query = query.in('priority', priority)
    }

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    if (category && category.length > 0) {
      query = query.in('category', category)
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: requests, error, count } = await query

    if (error) {
      console.error('Requests fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      requests: requests || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('GET requests error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/requests - Create new request
 *
 * Body:
 * - title: string (required)
 * - description: string (optional)
 * - company_id: UUID (required)
 * - category: 'document' | 'question' | 'task' | 'other' (required)
 * - priority: 'low' | 'medium' | 'high' | 'urgent' (optional, default: 'medium')
 * - status: 'new' | 'in_progress' | 'resolved' | 'closed' (optional, default: 'new')
 * - assigned_to: UUID (optional)
 * - response_to_client: string (optional)
 * - internal_notes: string (optional)
 * - attachments: string[] (optional)
 *
 * Returns: Created request with ID
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication via middleware header
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const supabase = createServerClient()

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.company_id || !body.category) {
      return NextResponse.json(
        { error: 'Název požadavku, company_id a kategorie jsou povinné' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['document', 'question', 'task', 'other']
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: 'Neplatná kategorie. Povolené hodnoty: document, question, task, other' },
        { status: 400 }
      )
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { error: 'Neplatná priorita. Povolené hodnoty: low, medium, high, urgent' },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ['new', 'in_progress', 'resolved', 'closed']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Neplatný status. Povolené hodnoty: new, in_progress, resolved, closed' },
        { status: 400 }
      )
    }

    const requestData = {
      title: body.title,
      description: body.description || null,
      company_id: body.company_id,
      category: body.category,
      priority: body.priority || 'medium',
      status: body.status || 'new',
      assigned_to: body.assigned_to || null,
      created_by: userId,
      response_to_client: body.response_to_client || null,
      internal_notes: body.internal_notes || null,
      attachments: body.attachments || null,
    }

    // Create request
    const { data: newRequest, error } = await supabase
      .from('client_requests')
      .insert(requestData)
      .select()
      .single()

    if (error) {
      console.error('Request creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error: any) {
    console.error('POST request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
